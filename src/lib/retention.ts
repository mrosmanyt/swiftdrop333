import { db } from "@/lib/db";
import { eraseUserAccount, writeAudit } from "@/lib/repo";
import { deleteDocumentFile, deletePodPhoto } from "@/lib/storage";

/**
 * Data retention — personal data is kept only as long as it's needed, then
 * removed automatically. This is what stops the database (and every backup
 * or snapshot of the volume) from silently accumulating years of customer
 * phone numbers, chat logs and identity documents.
 *
 * Runs at most once an hour, piggy-backing on the dispatch tick (which is
 * already driven by normal app traffic). Every window is configurable by
 * env var; the defaults are deliberately conservative but short.
 *
 * What is NOT removed: order totals, fees, dates, statuses and business
 * names — the financial record a business has to keep for tax purposes
 * (CRA: six years). Those carry no customer contact details once the
 * customer fields below have been cleared.
 */

const days = (name: string, fallback: number) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

export const RETENTION = {
  /** Identity-document files after the application is reviewed. */
  documentFileDays: days("DOC_FILE_RETENTION_DAYS", 30),
  /** Proof-of-delivery photos after delivery (dispute window). */
  podPhotoDays: days("POD_RETENTION_DAYS", 90),
  /** SMS/email delivery log rows. */
  notificationDays: days("NOTIFICATION_RETENTION_DAYS", 90),
  /** Chat messages, once the order is finished. */
  chatDays: days("CHAT_RETENTION_DAYS", 90),
  /** Customer phone/email/instructions on finished orders. */
  orderContactDays: days("ORDER_PII_RETENTION_DAYS", 365),
  /** Grace period before a deleted/closed account is permanently erased. */
  erasureGraceDays: days("ERASE_DELETED_AFTER_DAYS", 30),
};

const TERMINAL = `('DELIVERED','FAILED','RETURNED','CANCELLED')`;
const cutoff = (d: number) => new Date(Date.now() - d * 86400 * 1000).toISOString();

const g = globalThis as unknown as { __swiftdropRetentionAt?: number };

/** Throttled entry point — safe to call on every request/tick. */
export async function maybeRunRetention() {
  const last = g.__swiftdropRetentionAt ?? 0;
  if (Date.now() - last < 60 * 60 * 1000) return;
  g.__swiftdropRetentionAt = Date.now();
  try {
    await runRetention();
  } catch (e) {
    console.error("[retention] failed:", (e as Error)?.message ?? e);
  }
}

export async function runRetention() {
  const summary: Record<string, number> = {};
  const n = (r: { changes: number | bigint }) => Number(r.changes);

  // 1. Bank details never belong here. Any void-cheque or merchant personal
  //    ID upload from before this policy is deleted outright.
  {
    const rows = await db
      .prepare(
        `SELECT DISTINCT owner_id FROM documents
          WHERE owner_type = 'merchant' AND doc_type IN ('void_cheque','id') AND file_purged_at IS NULL`
      )
      .all() as { owner_id: string }[];
    let count = 0;
    for (const { owner_id } of rows) {
      const files = await db
        .prepare(
          `SELECT url FROM documents WHERE owner_type = 'merchant' AND owner_id = ? AND doc_type IN ('void_cheque','id') AND file_purged_at IS NULL`
        )
        .all(owner_id) as { url: string }[];
      await Promise.all(files.map((f) => deleteDocumentFile(f.url)));
      count += n(
        await db
          .prepare(
            `UPDATE documents SET url = '', original_name = NULL, file_purged_at = ?
              WHERE owner_type = 'merchant' AND owner_id = ? AND doc_type IN ('void_cheque','id') AND file_purged_at IS NULL`
          )
          .run(new Date().toISOString(), owner_id)
      );
    }
    summary.bankAndIdDocsDeleted = count;
  }

  // 2. Identity-document files some time after the application decision.
  {
    const rows = await db
      .prepare(
        `SELECT id, url FROM documents WHERE file_purged_at IS NULL AND reviewed_at IS NOT NULL AND reviewed_at < ?`
      )
      .all(cutoff(RETENTION.documentFileDays)) as { id: string; url: string }[];
    // Abandoned applications: never reviewed, uploaded long ago.
    rows.push(
      ...(await db
        .prepare(`SELECT id, url FROM documents WHERE file_purged_at IS NULL AND reviewed_at IS NULL AND created_at < ?`)
        .all(cutoff(180)) as { id: string; url: string }[])
    );
    for (const r of rows) {
      await deleteDocumentFile(r.url);
      await db.prepare(`UPDATE documents SET url = '', original_name = NULL, file_purged_at = ? WHERE id = ?`).run(
        new Date().toISOString(),
        r.id
      );
    }
    // Also clear the convenience pointers on courier profiles.
    await db.exec(`
      UPDATE courier_profiles SET license_doc_url = NULL
       WHERE license_doc_url IS NOT NULL AND license_doc_url NOT IN (SELECT url FROM documents WHERE url != '');
      UPDATE courier_profiles SET insurance_doc_url = NULL
       WHERE insurance_doc_url IS NOT NULL AND insurance_doc_url NOT IN (SELECT url FROM documents WHERE url != '');
    `);
    summary.documentFilesDeleted = rows.length;
  }

  // 3. Proof-of-delivery photos after the dispute window.
  {
    const rows = await db
      .prepare(
        `SELECT id, proof_of_delivery_url as url FROM orders
          WHERE proof_purged_at IS NULL AND proof_of_delivery_url IS NOT NULL AND delivered_at < ?`
      )
      .all(cutoff(RETENTION.podPhotoDays)) as { id: string; url: string }[];
    for (const r of rows) {
      await deletePodPhoto(r.url);
      await db.prepare(`UPDATE orders SET proof_of_delivery_url = NULL, proof_purged_at = ? WHERE id = ?`).run(
        new Date().toISOString(),
        r.id
      );
    }
    summary.podPhotosDeleted = rows.length;
  }

  // 4. Notification log.
  summary.notificationsDeleted = n(
    await db.prepare(`DELETE FROM notifications WHERE created_at < ?`).run(cutoff(RETENTION.notificationDays))
  );

  // 5. Chat on finished orders.
  {
    const old = `SELECT id FROM orders WHERE status IN ${TERMINAL}
                   AND COALESCE(delivered_at, returned_at, cancelled_at, created_at) < ?`;
    const c = cutoff(RETENTION.chatDays);
    summary.chatMessagesDeleted = n(await db.prepare(`DELETE FROM messages WHERE order_id IN (${old})`).run(c));
    await db.prepare(`DELETE FROM message_read_state WHERE order_id IN (${old})`).run(c);
    await db.prepare(`DELETE FROM push_subscriptions WHERE subject_type = 'order' AND subject_id IN (${old})`).run(c);
  }

  // 6. Customer contact details on old finished orders.
  summary.ordersAnonymised = n(
    await db
      .prepare(
        `UPDATE orders
            SET customer_phone = NULL, customer_email = NULL, delivery_instructions = NULL,
                customer_comment = NULL, merchant_rating_comment = NULL, pii_purged_at = ?
          WHERE pii_purged_at IS NULL AND status IN ${TERMINAL}
            AND COALESCE(delivered_at, returned_at, cancelled_at, created_at) < ?`
      )
      .run(new Date().toISOString(), cutoff(RETENTION.orderContactDays))
  );
  // Free-text reasons in the event log for those same orders.
  await db.prepare(
    `UPDATE order_events SET payload = NULL
      WHERE payload IS NOT NULL AND order_id IN (SELECT id FROM orders WHERE pii_purged_at IS NOT NULL)`
  ).run();

  // 7. Location history older than a day (also pruned per courier on write,
  //    but a courier who never comes back online would otherwise keep it).
  summary.locationPingsDeleted = n(
    await db.prepare(`DELETE FROM courier_location_pings WHERE created_at < ?`).run(cutoff(1))
  );
  // Expired location-share links and old safety-incident coordinates.
  summary.locationSharesDeleted = n(
    await db.prepare(`DELETE FROM location_shares WHERE expires_at < ?`).run(cutoff(1))
  );
  await db.prepare(
    `UPDATE safety_incidents SET lat = NULL, lng = NULL WHERE status = 'resolved' AND resolved_at < ? AND lat IS NOT NULL`
  ).run(cutoff(RETENTION.orderContactDays));

  // 8. Deleted / closed accounts past their grace period are erased for good.
  //    Only accounts with erase_after set qualify (i.e. deleted after this
  //    policy shipped) — never admins.
  {
    const users = await db
      .prepare(
        `SELECT id FROM users WHERE status != 'erased' AND role != 'ADMIN' AND erase_after IS NOT NULL AND erase_after < ?`
      )
      .all(new Date().toISOString()) as { id: string }[];
    for (const u of users) {
      await Promise.all(
        (await eraseUserAccount(u.id, null, `auto-erased ${RETENTION.erasureGraceDays} days after deletion`)).map(
          deleteDocumentFile
        )
      );
    }
    summary.accountsErased = users.length;
  }

  const total = Object.values(summary).reduce((a, b) => a + b, 0);
  if (total > 0) {
    await writeAudit(null, "retention_run", "system", undefined, JSON.stringify(summary));
    console.log("[retention]", JSON.stringify(summary));
  }
  return summary;
}

/** Admin "erase now" for a deleted courier or merchant. */
export async function eraseNow(userId: string, adminUserId: string) {
  await Promise.all((await eraseUserAccount(userId, adminUserId, "erased by admin")).map(deleteDocumentFile));
}

