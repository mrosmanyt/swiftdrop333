import Link from "next/link";
import { PageHeader } from "@/components/portal/ui";
import { staffPage } from "@/lib/cms/staff";
import { can } from "@/lib/cms/permissions";
import { SECTIONS } from "@/lib/cms/sections";
import { listSectionStatus } from "@/lib/cms/content";

export const dynamic = "force-dynamic";

const GROUPS = ["Pages", "Site-wide", "Marketing tools", "Settings"] as const;

/** Every part of the website that can be edited, with its current state. */
export default async function WebsiteContentIndexPage() {
  const staff = await staffPage("content.view");
  const status = await listSectionStatus();
  const sections = SECTIONS.filter((s) => s.key !== "alerts" || can(staff.staffRole, "settings.edit"));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website content"
        subtitle="Pick what you want to change. Nothing changes on the website until you press Publish."
      />
      {GROUPS.map((group) => {
        const list = sections.filter((s) => s.group === group);
        if (!list.length) return null;
        return (
          <section key={group}>
            <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-fg-subtle">{group}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s) => {
                const st = status[s.key];
                const badge = st?.hasDraft
                  ? { text: "Draft waiting", tone: "bg-info-soft text-info" }
                  : st?.isPublished
                  ? { text: "Edited & live", tone: "bg-ok-soft text-ok" }
                  : { text: "Original", tone: "bg-surface-2 text-fg-muted" };
                return (
                  <Link
                    key={s.key}
                    href={`/admin/website/content/${s.key}`}
                    className="card-shadow block rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-accent/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[15px] font-semibold text-fg">{s.title}</h3>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.tone}`}>{badge.text}</span>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">{s.about}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
