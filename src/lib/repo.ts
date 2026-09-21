import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { computeCourierTier } from "@/lib/pricing";

/**
 * Data-access layer — every API route and page in the app goes through
 * these functions instead of writing raw SQL inline. This is the single
 * place to swap SQLite for Postgres later without touching route/page code.
 */

export type Role = "MERCHANT" | "COURIER" | "ADMIN" | "CUSTOMER";
export type ServiceType = "NEXT_DAY" | "SAME_DAY" | "DIRECT" | "BATCH";
export type OrderStatus =
  | "PENDING"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "FAILED"
  | "RETURNING"
  | "RETURNED"
  | "CANCELLED";
export type CourierTier = "STARTER" | "SILVER" | "GOLD" | "PRO";
export type VehicleType = "BIKE" | "SCOOTER" | "CAR" | "VAN";

const id = () => randomUUID();
const now = () => new Date().toISOString();

/**
 * node:sqlite returns rows with a null prototype. React refuses to pass
 * those from a Server Component to a Client Component, so every row that
 * leaves this module unmapped goes through here first to become a plain
 * object. (The map* functions below already build plain objects.)
 */
function toPlain<T = any>(row: any): T {
  return { ...(row as object) } as T;
}

function logEvent(orderId: string, type: string, payload?: unknown) {
  db.prepare(
    `INSERT INTO order_events (id, order_id, type, payload, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(id(), orderId, type, payload ? JSON.stringify(payload) : null, now());
}

// ---------------------------------------------------------------------------
// Audit log — every admin decision is recorded, for compliance and support
// ---------------------------------------------------------------------------

export function writeAudit(
  actorUserId: string | null,
  action: string,
  targetType?: string,
  targetId?: string,
  notes?: string
) {
  db.prepare(
    `INSERT INTO audit_log (id, actor_user_id, action, target_type, target_id, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id(), actorUserId, action, targetType ?? null, targetId ?? null, notes ?? null, now());
}

export function listAuditForTarget(targetType: string, targetId: string) {
  return db
    .prepare(
      `SELECT a.*, u.email as actor_email FROM audit_log a
       LEFT JOIN users u ON u.id = a.actor_user_id
       WHERE a.target_type = ? AND a.target_id = ? ORDER BY a.created_at DESC`
    )
    .all(targetType, targetId)
    .map(toPlain) as any[];
}

// ---------------------------------------------------------------------------
// Documents (courier licence/insurance, merchant business docs)
// ---------------------------------------------------------------------------

export function addDocument(input: {
  ownerType: "courier" | "merchant";
  ownerId: string;
  docType: string;
  url: string;
  originalName?: string;
}) {
  const docId = id();
  db.prepare(
    `INSERT INTO documents (id, owner_type, owner_id, doc_type, url, original_name, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`
  ).run(docId, input.ownerType, input.ownerId, input.docType, input.url, input.originalName ?? null, now());
  return docId;
}

export function listDocuments(ownerType: "courier" | "merchant", ownerId: string) {
  return db
    .prepare(
      `SELECT id, owner_type as ownerType, owner_id as ownerId, doc_type as docType,
              url, original_name as originalName, status, created_at as createdAt
       FROM documents WHERE owner_type = ? AND owner_id = ? ORDER BY created_at DESC`
    )
    .all(ownerType, ownerId)
    .map(toPlain) as any[];
}

export function setDocumentStatus(docId: string, status: "pending" | "accepted" | "rejected") {
  db.prepare(`UPDATE documents SET status = ? WHERE id = ?`).run(status, docId);
}

export function getDocumentById(docId: string) {
  const r = db.prepare(`SELECT * FROM documents WHERE id = ?`).get(docId) as any;
  if (!r) return null;
  return {
    id: r.id,
    ownerType: r.owner_type,
    ownerId: r.owner_id,
    docType: r.doc_type,
    url: r.url,
    originalName: r.original_name,
    status: r.status,
    createdAt: r.created_at,
  };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface UserRow {
  id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  passwordHash: string;
  role: Role;
  status: string;
  locale: string;
  createdAt: string;
}

function mapUser(r: any): UserRow | null {
  if (!r) return null;
  return {
    id: r.id,
    email: r.email,
    phone: r.phone,
    fullName: r.full_name ?? null,
    passwordHash: r.password_hash,
    role: r.role,
    status: r.status ?? "active",
    locale: r.locale ?? "en",
    createdAt: r.created_at,
  };
}

export function findUserByEmail(email: string) {
  return mapUser(db.prepare(`SELECT * FROM users WHERE email = ?`).get(email));
}

export function findUserById(userId: string) {
  return mapUser(db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId));
}

export function createUser(input: {
  email: string;
  phone?: string;
  fullName?: string;
  passwordHash: string;
  role: Role;
}) {
  const userId = id();
  db.prepare(
    `INSERT INTO users (id, email, phone, full_name, password_hash, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    userId,
    input.email,
    input.phone ?? null,
    input.fullName ?? null,
    input.passwordHash,
    input.role,
    now(),
    now()
  );
  return userId;
}

export function setUserStatus(userId: string, status: "active" | "suspended") {
  db.prepare(`UPDATE users SET status = ?, updated_at = ? WHERE id = ?`).run(status, now(), userId);
}

// ---------------------------------------------------------------------------
// Merchant profiles
// ---------------------------------------------------------------------------

function mapMerchant(r: any) {
  if (!r) return null;
  return {
    id: r.id,
    userId: r.user_id,
    businessName: r.business_name,
    contactName: r.contact_name ?? null,
    businessPhone: r.business_phone ?? null,
    businessAddress: r.business_address ?? null,
    businessNumber: r.business_number ?? null,
    website: r.website ?? null,
    kybStatus: r.kyb_status,
    kybNotes: r.kyb_notes ?? null,
    rating: r.rating ?? 5,
    reviewedAt: r.reviewed_at ?? null,
    payoutMethod: r.payout_method,
    shopifyDomain: r.shopify_domain,
    createdAt: r.created_at,
    email: r.email, // present when joined with users
    userStatus: r.user_status, // present when joined with users
    orderCount: r.order_count, // present when joined with count
    deletedAt: r.deleted_at ?? null,
  };
}

export function createMerchantProfile(input: {
  userId: string;
  businessName: string;
  contactName?: string;
  businessPhone?: string;
  businessAddress?: string;
  businessNumber?: string;
  website?: string;
  kybStatus?: string;
}) {
  const profileId = id();
  db.prepare(
    `INSERT INTO merchant_profiles
       (id, user_id, business_name, contact_name, business_phone, business_address,
        business_number, website, kyb_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    profileId,
    input.userId,
    input.businessName,
    input.contactName ?? null,
    input.businessPhone ?? null,
    input.businessAddress ?? null,
    input.businessNumber ?? null,
    input.website ?? null,
    input.kybStatus ?? "pending",
    now()
  );
  return profileId;
}

/** Admin decision on a merchant's KYB application. */
export function setMerchantKybStatus(
  merchantId: string,
  status: "pending" | "verified" | "rejected",
  reviewerUserId: string,
  notes?: string
) {
  db.prepare(
    `UPDATE merchant_profiles SET kyb_status = ?, kyb_notes = ?, reviewed_at = ?, reviewed_by = ? WHERE id = ?`
  ).run(status, notes ?? null, now(), reviewerUserId, merchantId);
  writeAudit(reviewerUserId, `merchant_${status}`, "merchant", merchantId, notes);
}

export function listMerchantsByKyb(status: string) {
  return db
    .prepare(
      `SELECT m.*, u.email as email, u.status as user_status
       FROM merchant_profiles m JOIN users u ON u.id = m.user_id
       WHERE m.kyb_status = ? ORDER BY m.created_at ASC`
    )
    .all(status)
    .map(mapMerchant);
}

export function getMerchantProfileByUserId(userId: string) {
  return mapMerchant(
    db.prepare(`SELECT * FROM merchant_profiles WHERE user_id = ?`).get(userId)
  );
}

export function getMerchantProfileById(profileId: string) {
  return mapMerchant(
    db.prepare(`SELECT * FROM merchant_profiles WHERE id = ?`).get(profileId)
  );
}

export function listMerchants() {
  const rows = db
    .prepare(
      `SELECT m.*, u.email as email, u.status as user_status,
              (SELECT COUNT(*) FROM orders o WHERE o.merchant_id = m.id) as order_count
       FROM merchant_profiles m
       JOIN users u ON u.id = m.user_id
       WHERE m.deleted_at IS NULL
       ORDER BY m.created_at DESC`
    )
    .all();
  return rows.map(mapMerchant);
}

/** Soft delete — moves the merchant to /admin/deleted-records instead of
 *  erasing it, so a wrong click doesn't destroy real order history. */
export function softDeleteMerchant(merchantId: string, adminUserId: string) {
  db.prepare(`UPDATE merchant_profiles SET deleted_at = ?, deleted_by = ? WHERE id = ?`).run(
    now(),
    adminUserId,
    merchantId
  );
  writeAudit(adminUserId, "merchant_deleted", "merchant", merchantId);
}

export function restoreMerchant(merchantId: string, adminUserId: string) {
  db.prepare(`UPDATE merchant_profiles SET deleted_at = NULL, deleted_by = NULL WHERE id = ?`).run(
    merchantId
  );
  writeAudit(adminUserId, "merchant_restored", "merchant", merchantId);
}

export function listDeletedMerchants() {
  return db
    .prepare(
      `SELECT m.*, u.email as email, u.status as user_status
       FROM merchant_profiles m JOIN users u ON u.id = m.user_id
       WHERE m.deleted_at IS NOT NULL ORDER BY m.deleted_at DESC`
    )
    .all()
    .map(mapMerchant);
}

// ---------------------------------------------------------------------------
// Courier profiles
// ---------------------------------------------------------------------------

function mapCourier(r: any) {
  if (!r) return null;
  return {
    id: r.id,
    userId: r.user_id,
    fullName: r.full_name ?? null,
    phone: r.phone ?? null,
    vehicleType: r.vehicle_type as VehicleType,
    vehicleMakeModel: r.vehicle_make_model ?? null,
    vehiclePlate: r.vehicle_plate ?? null,
    licenseNumber: r.license_number,
    licenseExpiry: r.license_expiry ?? null,
    licenseDocUrl: r.license_doc_url ?? null,
    insuranceProvider: r.insurance_provider ?? null,
    insurancePolicyNumber: r.insurance_policy_number ?? null,
    insuranceExpiry: r.insurance_expiry ?? null,
    insuranceDocUrl: r.insurance_doc_url ?? null,
    backgroundCheckStatus: r.background_check_status,
    approvalStatus: r.approval_status ?? "pending",
    approvalNotes: r.approval_notes ?? null,
    reviewedAt: r.reviewed_at ?? null,
    tier: r.tier as CourierTier,
    rating: r.rating,
    isOnline: !!r.is_online,
    hasInsulatedBag: !!r.has_insulated_bag,
    locale: r.locale ?? "en",
    lastLat: r.last_lat,
    lastLng: r.last_lng,
    lastLocationAt: r.last_location_at,
    emergencyContactName: r.emergency_contact_name ?? null,
    emergencyContactPhone: r.emergency_contact_phone ?? null,
    createdAt: r.created_at,
    email: r.email,
    userStatus: r.user_status,
    orderCount: r.order_count,
    deletedAt: r.deleted_at ?? null,
  };
}

export function createCourierProfile(input: {
  userId: string;
  vehicleType: VehicleType;
  fullName?: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiry?: string;
  vehicleMakeModel?: string;
  vehiclePlate?: string;
  backgroundCheckStatus?: string;
  approvalStatus?: string;
}) {
  const profileId = id();
  db.prepare(
    `INSERT INTO courier_profiles
       (id, user_id, vehicle_type, full_name, phone, license_number, license_expiry,
        insurance_provider, insurance_policy_number, insurance_expiry,
        vehicle_make_model, vehicle_plate, background_check_status, approval_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    profileId,
    input.userId,
    input.vehicleType,
    input.fullName ?? null,
    input.phone ?? null,
    input.licenseNumber ?? null,
    input.licenseExpiry ?? null,
    input.insuranceProvider ?? null,
    input.insurancePolicyNumber ?? null,
    input.insuranceExpiry ?? null,
    input.vehicleMakeModel ?? null,
    input.vehiclePlate ?? null,
    input.backgroundCheckStatus ?? "pending",
    input.approvalStatus ?? "pending",
    now()
  );
  return profileId;
}

/** Admin decision on a courier application. */
export function setCourierApprovalStatus(
  courierId: string,
  status: "pending" | "approved" | "rejected" | "suspended",
  reviewerUserId: string,
  notes?: string
) {
  db.prepare(
    `UPDATE courier_profiles SET approval_status = ?, approval_notes = ?, reviewed_at = ?, reviewed_by = ? WHERE id = ?`
  ).run(status, notes ?? null, now(), reviewerUserId, courierId);
  // A rejected or suspended courier must not stay online taking offers.
  if (status !== "approved") {
    db.prepare(`UPDATE courier_profiles SET is_online = 0 WHERE id = ?`).run(courierId);
  }
  writeAudit(reviewerUserId, `courier_${status}`, "courier", courierId, notes);
}

export function setCourierBackgroundCheck(courierId: string, status: string) {
  db.prepare(`UPDATE courier_profiles SET background_check_status = ? WHERE id = ?`).run(
    status,
    courierId
  );
}

export function listCouriersByApproval(status: string) {
  return db
    .prepare(
      `SELECT c.*, u.email as email, u.status as user_status
       FROM courier_profiles c JOIN users u ON u.id = c.user_id
       WHERE c.approval_status = ? ORDER BY c.created_at ASC`
    )
    .all(status)
    .map(mapCourier);
}

export function updateCourierDocUrl(courierId: string, field: "license_doc_url" | "insurance_doc_url", url: string) {
  db.prepare(`UPDATE courier_profiles SET ${field} = ? WHERE id = ?`).run(url, courierId);
}

export function getCourierProfileByUserId(userId: string) {
  return mapCourier(
    db.prepare(`SELECT * FROM courier_profiles WHERE user_id = ?`).get(userId)
  );
}

export function getCourierProfileById(profileId: string) {
  return mapCourier(
    db.prepare(`SELECT * FROM courier_profiles WHERE id = ?`).get(profileId)
  );
}

export function listCouriers(opts: { onlineOnly?: boolean } = {}) {
  const rows = db
    .prepare(
      `SELECT c.*, u.email as email, u.status as user_status,
              (SELECT COUNT(*) FROM orders o WHERE o.courier_id = c.id AND o.status = 'DELIVERED') as order_count
       FROM courier_profiles c
       JOIN users u ON u.id = c.user_id
       WHERE c.deleted_at IS NULL ${opts.onlineOnly ? "AND c.is_online = 1" : ""}
       ORDER BY CASE c.tier WHEN 'PRO' THEN 3 WHEN 'GOLD' THEN 2 WHEN 'SILVER' THEN 1 ELSE 0 END DESC`
    )
    .all();
  return rows.map(mapCourier);
}

/** Soft delete — moves the courier to /admin/deleted-records instead of
 *  erasing it, so a wrong click doesn't destroy real delivery history. */
export function softDeleteCourier(courierId: string, adminUserId: string) {
  db.prepare(`UPDATE courier_profiles SET deleted_at = ?, deleted_by = ? WHERE id = ?`).run(
    now(),
    adminUserId,
    courierId
  );
  writeAudit(adminUserId, "courier_deleted", "courier", courierId);
}

export function restoreCourier(courierId: string, adminUserId: string) {
  db.prepare(`UPDATE courier_profiles SET deleted_at = NULL, deleted_by = NULL WHERE id = ?`).run(
    courierId
  );
  writeAudit(adminUserId, "courier_restored", "courier", courierId);
}

export function listDeletedCouriers() {
  return db
    .prepare(
      `SELECT c.*, u.email as email, u.status as user_status
       FROM courier_profiles c JOIN users u ON u.id = c.user_id
       WHERE c.deleted_at IS NOT NULL ORDER BY c.deleted_at DESC`
    )
    .all()
    .map(mapCourier);
}

export function setCourierOnline(courierId: string, isOnline: boolean) {
  db.prepare(`UPDATE courier_profiles SET is_online = ? WHERE id = ?`).run(
    isOnline ? 1 : 0,
    courierId
  );
}

export function setCourierTier(courierId: string, tier: CourierTier) {
  db.prepare(`UPDATE courier_profiles SET tier = ? WHERE id = ?`).run(tier, courierId);
}

/**
 * Recompute a courier's Courier+ tier from their last 14 days and store it.
 *
 * The tier is denormalised onto courier_profiles because dispatch ranks
 * candidates by it on every offer and can't afford a 14-day aggregate per
 * courier per order. It therefore has to be refreshed whenever a delivery
 * closes — otherwise a courier who has clearly earned SILVER keeps the
 * STARTER row, loses the per-delivery bonus, and gets ranked below couriers
 * they should be ahead of.
 */
export function refreshCourierTier(courierId: string): CourierTier {
  const tier = computeCourierTier(computeCourierStats14d(courierId));
  setCourierTier(courierId, tier);
  return tier;
}

/**
 * Live location tracking — called every few seconds from the driver app
 * while the courier is online (see components/LocationBroadcaster.tsx).
 * Also appends a breadcrumb ping (courier_location_pings) so an order's
 * route can be replayed later; pings older than 24h are pruned on write.
 */
export function updateCourierLocation(
  courierId: string,
  lat: number,
  lng: number,
  activeOrderId?: string | null
) {
  const ts = now();
  db.prepare(
    `UPDATE courier_profiles SET last_lat = ?, last_lng = ?, last_location_at = ?, is_online = 1 WHERE id = ?`
  ).run(lat, lng, ts, courierId);

  db.prepare(
    `INSERT INTO courier_location_pings (id, courier_id, order_id, lat, lng, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id(), courierId, activeOrderId ?? null, lat, lng, ts);

  db.prepare(
    `DELETE FROM courier_location_pings WHERE courier_id = ? AND created_at < datetime('now', '-1 day')`
  ).run(courierId);
}

export function getCourierLocationTrail(courierId: string, orderId: string) {
  return db
    .prepare(
      `SELECT lat, lng, created_at as createdAt FROM courier_location_pings
       WHERE courier_id = ? AND order_id = ? ORDER BY created_at ASC`
    )
    .all(courierId, orderId)
    .map(toPlain);
}

/** Rolling 14-day performance stats, used to compute the courier's tier. */
export function computeCourierStats14d(courierId: string) {
  const row = db
    .prepare(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'DELIVERED') as delivered,
         COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
         COUNT(*) as total
       FROM orders
       WHERE courier_id = ? AND assigned_at >= datetime('now', '-14 days')`
    )
    .get(courierId) as any;

  const delivered = row?.delivered ?? 0;
  const failed = row?.failed ?? 0;
  const completed = delivered + failed;
  const completionRate = completed > 0 ? delivered / completed : 1;

  return { completionRate, deliveries: delivered, misdeliveries: 0, complaints: 0, suspensions: 0 };
}

// ---------------------------------------------------------------------------
// Admin profiles
// ---------------------------------------------------------------------------

export function createAdminProfile(input: { userId: string; permissions?: string[] }) {
  const profileId = id();
  db.prepare(
    `INSERT INTO admin_profiles (id, user_id, permissions) VALUES (?, ?, ?)`
  ).run(profileId, input.userId, JSON.stringify(input.permissions ?? []));
  return profileId;
}

// ---------------------------------------------------------------------------
// Zones
// ---------------------------------------------------------------------------

function mapZone(r: any) {
  if (!r) return null;
  return {
    id: r.id,
    city: r.city,
    name: r.name,
    baseRateCents: r.base_rate_cents,
    perKmCents: r.per_km_cents,
    isActive: !!r.is_active,
    surgeMultiplier: r.surge_multiplier ?? 1,
    surgeNote: r.surge_note ?? null,
    createdAt: r.created_at,
  };
}

export function createZone(input: {
  city: string;
  name: string;
  baseRateCents: number;
  perKmCents?: number;
}) {
  const zoneId = id();
  db.prepare(
    `INSERT INTO zones (id, city, name, base_rate_cents, per_km_cents, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?)`
  ).run(zoneId, input.city, input.name, input.baseRateCents, input.perKmCents ?? 0, now());
  return zoneId;
}

export function listActiveZones() {
  return db.prepare(`SELECT * FROM zones WHERE is_active = 1 ORDER BY city ASC`).all().map(mapZone);
}

export function listAllZones() {
  return db.prepare(`SELECT * FROM zones ORDER BY city ASC`).all().map(mapZone);
}

export function getZoneById(zoneId: string) {
  return mapZone(db.prepare(`SELECT * FROM zones WHERE id = ?`).get(zoneId));
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

function mapOrder(r: any) {
  if (!r) return null;
  return {
    id: r.id,
    merchantId: r.merchant_id,
    courierId: r.courier_id,
    zoneId: r.zone_id,
    pickupAddress: r.pickup_address,
    pickupLat: r.pickup_lat,
    pickupLng: r.pickup_lng,
    dropoffAddress: r.dropoff_address,
    dropoffLat: r.dropoff_lat,
    dropoffLng: r.dropoff_lng,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    customerEmail: r.customer_email,
    deliveryInstructions: r.delivery_instructions,
    packageWeightKg: r.package_weight_kg,
    serviceType: r.service_type as ServiceType,
    status: r.status as OrderStatus,
    priceCents: r.price_cents,
    courierFeeCents: r.courier_fee_cents,
    platformFeeCents: r.platform_fee_cents,
    proofOfDeliveryUrl: r.proof_of_delivery_url,
    customerRating: r.customer_rating,
    customerComment: r.customer_comment,
    windowStart: r.window_start ?? null,
    windowEnd: r.window_end ?? null,
    distanceKm: r.distance_km ?? null,
    distanceSource: r.distance_source ?? null,
    etaMinutes: r.eta_minutes ?? null,
    dispatchMode: r.dispatch_mode ?? "auto",
    failureReason: r.failure_reason ?? null,
    returnedAt: r.returned_at ?? null,
    arrivedAtPickup: r.arrived_at_pickup ?? null,
    merchantRating: r.merchant_rating ?? null,
    merchantRatingComment: r.merchant_rating_comment ?? null,
    batchId: r.batch_id ?? null,
    batchSequence: r.batch_sequence ?? null,
    surgeMultiplier: r.surge_multiplier ?? 1,
    source: r.source ?? "portal",
    requiresAgeVerification: !!r.requires_age_verification,
    ageVerifiedAt: r.age_verified_at ?? null,
    ageVerificationMethod: r.age_verification_method ?? null,
    temperatureRequirement: r.temperature_requirement ?? "ambient",
    cancelledAt: r.cancelled_at ?? null,
    cancelledBy: r.cancelled_by ?? null,
    cancelReason: r.cancel_reason ?? null,
    refundStatus: r.refund_status ?? "none",
    refundAmountCents: r.refund_amount_cents ?? null,
    refundNote: r.refund_note ?? null,
    refundedAt: r.refunded_at ?? null,
    createdAt: r.created_at,
    assignedAt: r.assigned_at,
    pickedUpAt: r.picked_up_at,
    deliveredAt: r.delivered_at,
    // joined fields (present depending on query)
    zoneName: r.zone_name,
    merchantBusinessName: r.merchant_business_name,
    courierEmail: r.courier_email,
    courierVehicleType: r.courier_vehicle_type,
    courierLastLat: r.courier_last_lat,
    courierLastLng: r.courier_last_lng,
    courierLastLocationAt: r.courier_last_location_at,
    deletedAt: r.deleted_at ?? null,
  };
}

const ORDER_SELECT = `
  SELECT o.*, z.name as zone_name, m.business_name as merchant_business_name,
         cu.email as courier_email, c.vehicle_type as courier_vehicle_type,
         c.last_lat as courier_last_lat, c.last_lng as courier_last_lng,
         c.last_location_at as courier_last_location_at
  FROM orders o
  LEFT JOIN zones z ON z.id = o.zone_id
  LEFT JOIN merchant_profiles m ON m.id = o.merchant_id
  LEFT JOIN courier_profiles c ON c.id = o.courier_id
  LEFT JOIN users cu ON cu.id = c.user_id
`;

export function getOrderById(orderId: string) {
  return mapOrder(db.prepare(`${ORDER_SELECT} WHERE o.id = ?`).get(orderId));
}

export function listOrdersForMerchant(merchantId: string, limit = 100) {
  return db
    .prepare(`${ORDER_SELECT} WHERE o.merchant_id = ? ORDER BY o.created_at DESC LIMIT ?`)
    .all(merchantId, limit)
    .map(mapOrder);
}

export function listPendingOrders(limit = 50) {
  return db
    .prepare(`${ORDER_SELECT} WHERE o.status = 'PENDING' ORDER BY o.created_at ASC LIMIT ?`)
    .all(limit)
    .map(mapOrder);
}

export function listActiveOrdersForCourier(courierId: string) {
  return db
    .prepare(
      `${ORDER_SELECT} WHERE o.courier_id = ? AND o.status IN ('ASSIGNED','PICKED_UP','IN_TRANSIT','RETURNING') ORDER BY o.assigned_at ASC`
    )
    .all(courierId)
    .map(mapOrder);
}

export function listDeliveredOrdersForCourier(courierId: string, limit = 200) {
  return db
    .prepare(
      `${ORDER_SELECT} WHERE o.courier_id = ? AND o.status = 'DELIVERED' ORDER BY o.delivered_at DESC LIMIT ?`
    )
    .all(courierId, limit)
    .map(mapOrder);
}

/** All orders currently "in flight" with a courier assigned — feeds the admin live map. */
export function listActiveOrdersWithCourierLocation() {
  return db
    .prepare(
      `${ORDER_SELECT} WHERE o.status IN ('ASSIGNED','PICKED_UP','IN_TRANSIT') AND o.courier_id IS NOT NULL ORDER BY o.assigned_at ASC`
    )
    .all()
    .map(mapOrder);
}

export function listAllOrders(limit = 200) {
  return db
    .prepare(`${ORDER_SELECT} WHERE o.deleted_at IS NULL ORDER BY o.created_at DESC LIMIT ?`)
    .all(limit)
    .map(mapOrder);
}

/** Soft delete — moves the order to /admin/deleted-records instead of
 *  erasing it, so a wrong click doesn't destroy real delivery/payment
 *  history. Orders reference merchants/couriers by id, so nothing else
 *  breaks when one disappears from the live list. */
export function softDeleteOrder(orderId: string, adminUserId: string) {
  db.prepare(`UPDATE orders SET deleted_at = ?, deleted_by = ? WHERE id = ?`).run(
    now(),
    adminUserId,
    orderId
  );
  writeAudit(adminUserId, "order_deleted", "order", orderId);
}

export function restoreOrder(orderId: string, adminUserId: string) {
  db.prepare(`UPDATE orders SET deleted_at = NULL, deleted_by = NULL WHERE id = ?`).run(orderId);
  writeAudit(adminUserId, "order_restored", "order", orderId);
}

export function listDeletedOrders(limit = 200) {
  return db
    .prepare(`${ORDER_SELECT} WHERE o.deleted_at IS NOT NULL ORDER BY o.deleted_at DESC LIMIT ?`)
    .all(limit)
    .map(mapOrder);
}

export function createOrder(input: {
  merchantId: string;
  zoneId: string;
  pickupAddress: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffAddress: string;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  deliveryInstructions?: string | null;
  packageWeightKg?: number | null;
  serviceType: ServiceType;
  priceCents: number;
  courierFeeCents: number;
  platformFeeCents: number;
  windowStart?: string | null;
  windowEnd?: string | null;
  distanceKm?: number | null;
  distanceSource?: string | null;
  etaMinutes?: number | null;
  requiresAgeVerification?: boolean;
  temperatureRequirement?: string | null;
}) {
  const orderId = id();
  db.prepare(
    `INSERT INTO orders (
      id, merchant_id, zone_id, pickup_address, pickup_lat, pickup_lng,
      dropoff_address, dropoff_lat, dropoff_lng, customer_name, customer_phone,
      customer_email, delivery_instructions, package_weight_kg, service_type,
      status, price_cents, courier_fee_cents, platform_fee_cents, created_at,
      window_start, window_end, distance_km, distance_source, eta_minutes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    orderId,
    input.merchantId,
    input.zoneId,
    input.pickupAddress,
    input.pickupLat ?? null,
    input.pickupLng ?? null,
    input.dropoffAddress,
    input.dropoffLat ?? null,
    input.dropoffLng ?? null,
    input.customerName,
    input.customerPhone ?? null,
    input.customerEmail ?? null,
    input.deliveryInstructions ?? null,
    input.packageWeightKg ?? null,
    input.serviceType,
    input.priceCents,
    input.courierFeeCents,
    input.platformFeeCents,
    now(),
    input.windowStart ?? null,
    input.windowEnd ?? null,
    input.distanceKm ?? null,
    input.distanceSource ?? null,
    input.etaMinutes ?? null
  );

  if (input.requiresAgeVerification || input.temperatureRequirement) {
    db.prepare(
      `UPDATE orders SET requires_age_verification = ?, temperature_requirement = ? WHERE id = ?`
    ).run(
      input.requiresAgeVerification ? 1 : 0,
      input.temperatureRequirement ?? "ambient",
      orderId
    );
  }

  logEvent(orderId, "order_created", { status: "PENDING" });
  return orderId;
}

/**
 * Courier accepts an offer. Returns false if the order was already taken
 * (the UPDATE is conditional on status = 'PENDING', so two couriers racing
 * on the same order can't both win).
 */
export function acceptOrder(orderId: string, courierId: string) {
  const result = db
    .prepare(
      `UPDATE orders SET courier_id = ?, status = 'ASSIGNED', assigned_at = ? WHERE id = ? AND status = 'PENDING'`
    )
    .run(courierId, now(), orderId);
  if (result.changes > 0) {
    markOffersResolvedForOrder(orderId, courierId);
    logEvent(orderId, "courier_assigned", { courierId });
  }
  return result.changes > 0;
}

/**
 * Is this courier allowed to accept this order? Either they hold a live
 * targeted offer, or the order has fallen through to broadcast mode where
 * any approved online courier can grab it.
 */
export function canCourierAcceptOrder(orderId: string, courierId: string) {
  const order = getOrderById(orderId);
  if (!order || order.status !== "PENDING") return false;
  if (order.dispatchMode === "broadcast") return true;
  return courierHasActiveOffer(orderId, courierId);
}

export function markOrderPickedUp(orderId: string, courierId: string) {
  const result = db
    .prepare(
      `UPDATE orders SET status = 'PICKED_UP', picked_up_at = ? WHERE id = ? AND courier_id = ?`
    )
    .run(now(), orderId, courierId);
  if (result.changes > 0) logEvent(orderId, "status_change", { status: "PICKED_UP" });
  return result.changes > 0;
}

export function markOrderInTransit(orderId: string, courierId: string) {
  const result = db
    .prepare(`UPDATE orders SET status = 'IN_TRANSIT' WHERE id = ? AND courier_id = ?`)
    .run(orderId, courierId);
  if (result.changes > 0) logEvent(orderId, "status_change", { status: "IN_TRANSIT" });
  return result.changes > 0;
}

export function markOrderDelivered(orderId: string, courierId: string, proofUrl: string) {
  const result = db
    .prepare(
      `UPDATE orders SET status = 'DELIVERED', delivered_at = ?, proof_of_delivery_url = ? WHERE id = ? AND courier_id = ?`
    )
    .run(now(), proofUrl, orderId, courierId);
  if (result.changes > 0) {
    logEvent(orderId, "status_change", { status: "DELIVERED" });
    refreshCourierTier(courierId);
    const order = getOrderById(orderId);
    if (order) awardLoyaltyPointsForOrder(order);
  }
  return result.changes > 0;
}

export function markOrderFailed(orderId: string, courierId: string, reason: string) {
  const result = db
    .prepare(`UPDATE orders SET status = 'FAILED' WHERE id = ? AND courier_id = ?`)
    .run(orderId, courierId);
  if (result.changes > 0) {
    logEvent(orderId, "status_change", { status: "FAILED", reason });
    // A failed drop moves the completion rate, which can move the tier too.
    refreshCourierTier(courierId);
  }
  return result.changes > 0;
}

// A delivery already in the courier's hands can't be "un-delivered" by
// cancelling it — past this point it has to go through fail/return instead.
const CANCELLABLE_STATUSES = ["PENDING", "ASSIGNED"];

/**
 * Cancel an order before it's picked up. Merchant cancels their own order,
 * or admin cancels any order (stuck/duplicate/customer changed their mind).
 * Any live offer on the order is expired and, if it was sitting in a batch,
 * it's pulled out so the batch's stop count stays accurate. Billing here is
 * simple (merchants aren't charged until delivery completes today), so a
 * cancellation itself doesn't owe money back — refund_status only moves to
 * 'pending' when the caller says the merchant was actually charged for it.
 */
export function cancelOrder(
  orderId: string,
  actorUserId: string,
  reason: string,
  opts?: { wasCharged?: boolean }
) {
  const order = getOrderById(orderId);
  if (!order || !CANCELLABLE_STATUSES.includes(order.status)) return false;

  const result = db
    .prepare(
      `UPDATE orders SET status = 'CANCELLED', cancelled_at = ?, cancelled_by = ?, cancel_reason = ?,
              refund_status = CASE WHEN ? THEN 'pending' ELSE refund_status END
       WHERE id = ? AND status IN ('PENDING','ASSIGNED')`
    )
    .run(now(), actorUserId, reason, opts?.wasCharged ? 1 : 0, orderId);

  if (result.changes > 0) {
    logEvent(orderId, "status_change", { status: "CANCELLED", reason });
    db.prepare(`UPDATE offers SET status = 'expired', responded_at = ? WHERE order_id = ? AND status = 'offered'`).run(
      now(),
      orderId
    );
    if (order.batchId) {
      db.prepare(`UPDATE orders SET batch_id = NULL, batch_sequence = NULL WHERE id = ?`).run(orderId);
      const remaining = (
        db.prepare(`SELECT COUNT(*) as n FROM orders WHERE batch_id = ?`).get(order.batchId) as any
      ).n;
      db.prepare(`UPDATE batches SET stop_count = ? WHERE id = ?`).run(remaining, order.batchId);
    }
    writeAudit(actorUserId, "order_cancelled", "order", orderId, reason);
  }
  return result.changes > 0;
}

/** Admin settles a refund owed on a cancelled (or otherwise problem) order. */
export function setOrderRefund(
  orderId: string,
  adminUserId: string,
  status: "refunded" | "denied",
  amountCents?: number,
  note?: string
) {
  const result = db
    .prepare(
      `UPDATE orders SET refund_status = ?, refund_amount_cents = ?, refund_note = ?,
              refunded_at = CASE WHEN ? = 'refunded' THEN ? ELSE refunded_at END
       WHERE id = ?`
    )
    .run(status, amountCents ?? null, note ?? null, status, now(), orderId);
  if (result.changes > 0) {
    writeAudit(adminUserId, `refund_${status}`, "order", orderId, note ?? (amountCents ? `$${(amountCents / 100).toFixed(2)}` : undefined));
  }
  return result.changes > 0;
}

/** Customer rating — no auth required, the order id (tracking link) is the access key. */
export function submitOrderRating(orderId: string, rating: number, comment?: string) {
  const result = db
    .prepare(
      `UPDATE orders SET customer_rating = ?, customer_comment = ? WHERE id = ? AND status = 'DELIVERED' AND customer_rating IS NULL`
    )
    .run(rating, comment ?? null, orderId);

  if (result.changes > 0) {
    // Roll the rating into the courier's running average.
    const order = getOrderById(orderId);
    if (order?.courierId) {
      const agg = db
        .prepare(`SELECT AVG(customer_rating) as avg FROM orders WHERE courier_id = ? AND customer_rating IS NOT NULL`)
        .get(order.courierId) as any;
      if (agg?.avg) {
        db.prepare(`UPDATE courier_profiles SET rating = ? WHERE id = ?`).run(
          Math.round(agg.avg * 10) / 10,
          order.courierId
        );
      }
    }
    logEvent(orderId, "customer_rated", { rating, comment });
  }
  return result.changes > 0;
}

// ---------------------------------------------------------------------------
// Offers (the auto-dispatch queue)
// ---------------------------------------------------------------------------

export function createOffer(orderId: string, courierId: string, expiresInSeconds: number) {
  const offerId = id();
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  db.prepare(
    `INSERT INTO offers (id, order_id, courier_id, status, expires_at, created_at)
     VALUES (?, ?, ?, 'offered', ?, ?)`
  ).run(offerId, orderId, courierId, expiresAt, now());
  logEvent(orderId, "offer_sent", { courierId, expiresAt });
  return offerId;
}

/** Marks any 'offered' row whose timer has run out as expired. Returns how many. */
export function expireStaleOffers() {
  const result = db
    .prepare(`UPDATE offers SET status = 'expired', responded_at = ? WHERE status = 'offered' AND expires_at < ?`)
    .run(now(), now());
  return result.changes as number;
}

export function getActiveOfferForOrder(orderId: string) {
  const r = db
    .prepare(`SELECT * FROM offers WHERE order_id = ? AND status = 'offered' AND expires_at >= ? LIMIT 1`)
    .get(orderId, now()) as any;
  return r ? toPlain(r) : null;
}

/** The offers a courier is currently being shown, newest first. */
export function listActiveOffersForCourier(courierId: string) {
  return db
    .prepare(
      // Joins zones/merchant the same way ORDER_SELECT does, so a targeted
      // offer shows the zone name just like a broadcast one.
      `SELECT o.*, z.name as zone_name, m.business_name as merchant_business_name,
              f.id as offer_id, f.expires_at as offer_expires_at
       FROM offers f
       JOIN orders o ON o.id = f.order_id
       LEFT JOIN zones z ON z.id = o.zone_id
       LEFT JOIN merchant_profiles m ON m.id = o.merchant_id
       WHERE f.courier_id = ? AND f.status = 'offered' AND f.expires_at >= ? AND o.status = 'PENDING'
       ORDER BY f.created_at ASC`
    )
    .all(courierId, now())
    .map((r: any) => ({
      ...(mapOrder(r) as any),
      offerId: r.offer_id,
      offerExpiresAt: r.offer_expires_at,
    }));
}

export function declineOffer(offerId: string, courierId: string) {
  const result = db
    .prepare(
      `UPDATE offers SET status = 'declined', responded_at = ? WHERE id = ? AND courier_id = ? AND status = 'offered'`
    )
    .run(now(), offerId, courierId);
  return result.changes > 0;
}

export function markOffersResolvedForOrder(orderId: string, acceptedCourierId: string) {
  db.prepare(
    `UPDATE offers SET status = CASE WHEN courier_id = ? THEN 'accepted' ELSE 'expired' END,
                       responded_at = ?
     WHERE order_id = ? AND status = 'offered'`
  ).run(acceptedCourierId, now(), orderId);
}

/** Courier ids that have already been offered this order (any outcome). */
export function courierIdsAlreadyOffered(orderId: string): string[] {
  return (db.prepare(`SELECT DISTINCT courier_id FROM offers WHERE order_id = ?`).all(orderId) as any[]).map(
    (r) => r.courier_id
  );
}

/** Does this courier hold a live offer for this order? */
export function courierHasActiveOffer(orderId: string, courierId: string) {
  const r = db
    .prepare(
      `SELECT 1 as ok FROM offers WHERE order_id = ? AND courier_id = ? AND status = 'offered' AND expires_at >= ?`
    )
    .get(orderId, courierId, now());
  return !!r;
}

export function setOrderDispatchMode(orderId: string, mode: "auto" | "broadcast" | "manual") {
  db.prepare(`UPDATE orders SET dispatch_mode = ? WHERE id = ?`).run(mode, orderId);
  logEvent(orderId, "dispatch_mode", { mode });
}

/**
 * PENDING orders that need an offer sent: no live offer right now, and
 * either no scheduled window or the window is close enough to start
 * dispatching (default: 90 minutes ahead).
 */
export function ordersNeedingDispatch(leadMinutes = 90) {
  const cutoff = new Date(Date.now() + leadMinutes * 60 * 1000).toISOString();
  return db
    .prepare(
      `${ORDER_SELECT}
       WHERE o.status = 'PENDING'
         AND o.courier_id IS NULL
         AND (o.window_start IS NULL OR o.window_start <= ?)
         AND NOT EXISTS (
           SELECT 1 FROM offers f
           WHERE f.order_id = o.id AND f.status = 'offered' AND f.expires_at >= ?
         )
       ORDER BY o.created_at ASC
       LIMIT 25`
    )
    .all(cutoff, now())
    .map(mapOrder);
}

/**
 * Couriers eligible for a given order: online, approved, not suspended,
 * under the concurrent-delivery cap, and not already offered this order.
 */
export function candidateCouriersForOrder(orderId: string, maxConcurrent = 3) {
  const excluded = courierIdsAlreadyOffered(orderId);
  const placeholders = excluded.map(() => "?").join(",");
  return db
    .prepare(
      `SELECT c.*, u.email as email, u.status as user_status
       FROM courier_profiles c
       JOIN users u ON u.id = c.user_id
       WHERE c.is_online = 1
         AND c.approval_status = 'approved'
         AND u.status = 'active'
         AND (SELECT COUNT(*) FROM orders o
              WHERE o.courier_id = c.id
                AND o.status IN ('ASSIGNED','PICKED_UP','IN_TRANSIT')) < ?
         ${excluded.length ? `AND c.id NOT IN (${placeholders})` : ""}`
    )
    .all(maxConcurrent, ...excluded)
    .map(mapCourier);
}

export function setOrderRouteInfo(
  orderId: string,
  distanceKm: number,
  source: string,
  etaMinutes: number
) {
  db.prepare(`UPDATE orders SET distance_km = ?, distance_source = ?, eta_minutes = ? WHERE id = ?`).run(
    distanceKm,
    source,
    etaMinutes,
    orderId
  );
}

// ---------------------------------------------------------------------------
// Failed delivery / return-to-merchant
// ---------------------------------------------------------------------------

export function markOrderReturning(orderId: string, courierId: string, reason: string) {
  const result = db
    .prepare(
      `UPDATE orders SET status = 'RETURNING', failure_reason = ? WHERE id = ? AND courier_id = ? AND status IN ('PICKED_UP','IN_TRANSIT')`
    )
    .run(reason, orderId, courierId);
  if (result.changes > 0) logEvent(orderId, "status_change", { status: "RETURNING", reason });
  return result.changes > 0;
}

export function markOrderReturned(orderId: string, courierId: string) {
  const result = db
    .prepare(
      `UPDATE orders SET status = 'RETURNED', returned_at = ? WHERE id = ? AND courier_id = ? AND status = 'RETURNING'`
    )
    .run(now(), orderId, courierId);
  if (result.changes > 0) logEvent(orderId, "status_change", { status: "RETURNED" });
  return result.changes > 0;
}

/** Admin force-assign (manual dispatch override). */
export function adminAssignOrder(orderId: string, courierId: string, adminUserId: string) {
  const result = db
    .prepare(
      `UPDATE orders SET courier_id = ?, status = 'ASSIGNED', assigned_at = ?, dispatch_mode = 'manual'
       WHERE id = ? AND status IN ('PENDING','ASSIGNED')`
    )
    .run(courierId, now(), orderId);
  if (result.changes > 0) {
    markOffersResolvedForOrder(orderId, courierId);
    logEvent(orderId, "admin_assigned", { courierId, adminUserId });
    writeAudit(adminUserId, "order_assigned", "order", orderId, `courier ${courierId}`);
  }
  return result.changes > 0;
}

/**
 * Admin pulls an order back from a courier and returns it to the queue.
 * The previous offer history is cleared so the dispatch engine can offer
 * it around again from scratch — otherwise couriers who passed on it
 * earlier would be permanently excluded and it would go straight to
 * broadcast.
 */
export function adminUnassignOrder(orderId: string, adminUserId: string) {
  const result = db
    .prepare(
      `UPDATE orders SET courier_id = NULL, status = 'PENDING', assigned_at = NULL, dispatch_mode = 'auto'
       WHERE id = ? AND status IN ('ASSIGNED','PICKED_UP','IN_TRANSIT')`
    )
    .run(orderId);
  if (result.changes > 0) {
    db.prepare(`DELETE FROM offers WHERE order_id = ?`).run(orderId);
    logEvent(orderId, "admin_unassigned", { adminUserId });
    writeAudit(adminUserId, "order_unassigned", "order", orderId);
  }
  return result.changes > 0;
}

// ---------------------------------------------------------------------------
// Messages — one thread per order (customer ↔ courier, merchant can see it)
// ---------------------------------------------------------------------------

export function addMessage(input: {
  orderId: string;
  senderRole: "customer" | "courier" | "merchant" | "admin";
  senderUserId?: string | null;
  body: string;
}) {
  const messageId = id();
  db.prepare(
    `INSERT INTO messages (id, order_id, sender_role, sender_user_id, body, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(messageId, input.orderId, input.senderRole, input.senderUserId ?? null, input.body, now());
  return messageId;
}

export function listMessages(orderId: string) {
  return db
    .prepare(
      `SELECT id, order_id as orderId, sender_role as senderRole, body, created_at as createdAt
       FROM messages WHERE order_id = ? ORDER BY created_at ASC LIMIT 500`
    )
    .all(orderId)
    .map(toPlain) as any[];
}

// ---------------------------------------------------------------------------
// Notifications log
// ---------------------------------------------------------------------------

export function listNotifications(limit = 100) {
  return db
    .prepare(
      `SELECT n.*, o.customer_name as customerName FROM notifications n
       LEFT JOIN orders o ON o.id = n.order_id
       ORDER BY n.created_at DESC LIMIT ?`
    )
    .all(limit)
    .map(toPlain) as any[];
}

export function listNotificationsForOrder(orderId: string) {
  return db
    .prepare(`SELECT * FROM notifications WHERE order_id = ? ORDER BY created_at DESC`)
    .all(orderId)
    .map(toPlain) as any[];
}

// ---------------------------------------------------------------------------
// Two-way ratings — the courier rates the merchant on pickup experience
// ---------------------------------------------------------------------------

/** Courier taps "I'm at the pickup" — this timestamp is what makes the
 *  merchant's pickup wait time measurable. */
export function markArrivedAtPickup(orderId: string, courierId: string) {
  const result = db
    .prepare(
      `UPDATE orders SET arrived_at_pickup = ? WHERE id = ? AND courier_id = ? AND arrived_at_pickup IS NULL`
    )
    .run(now(), orderId, courierId);
  if (result.changes > 0) logEvent(orderId, "arrived_at_pickup", {});
  return result.changes > 0;
}

export function submitMerchantRating(
  orderId: string,
  courierId: string,
  rating: number,
  comment?: string
) {
  const result = db
    .prepare(
      `UPDATE orders SET merchant_rating = ?, merchant_rating_comment = ?
       WHERE id = ? AND courier_id = ? AND merchant_rating IS NULL
         AND status IN ('PICKED_UP','IN_TRANSIT','DELIVERED','RETURNING','RETURNED')`
    )
    .run(rating, comment ?? null, orderId, courierId);

  if (result.changes > 0) {
    const order = getOrderById(orderId);
    if (order?.merchantId) {
      const agg = db
        .prepare(
          `SELECT AVG(merchant_rating) as avg FROM orders WHERE merchant_id = ? AND merchant_rating IS NOT NULL`
        )
        .get(order.merchantId) as any;
      if (agg?.avg) {
        db.prepare(`UPDATE merchant_profiles SET rating = ? WHERE id = ?`).run(
          Math.round(agg.avg * 10) / 10,
          order.merchantId
        );
      }
    }
    logEvent(orderId, "merchant_rated", { rating, comment });
  }
  return result.changes > 0;
}

/**
 * Merchant pickup performance — average wait between the courier arriving
 * and the parcel actually being handed over. This is the number that tells
 * you which merchants are quietly costing you courier hours.
 */
export function merchantPickupStats(merchantId: string) {
  const row = db
    .prepare(
      `SELECT
         COUNT(*) as samples,
         AVG((julianday(picked_up_at) - julianday(arrived_at_pickup)) * 24 * 60) as avgWaitMinutes
       FROM orders
       WHERE merchant_id = ? AND arrived_at_pickup IS NOT NULL AND picked_up_at IS NOT NULL`
    )
    .get(merchantId) as any;
  return {
    samples: row?.samples ?? 0,
    avgWaitMinutes: row?.avgWaitMinutes ? Math.round(row.avgWaitMinutes * 10) / 10 : null,
  };
}

// ---------------------------------------------------------------------------
// Batches (multi-stop routes)
// ---------------------------------------------------------------------------

export function createBatch(input: {
  zoneId: string;
  orderIds: string[];
  totalKm: number;
  totalCourierFeeCents: number;
}) {
  const batchId = id();
  db.prepare(
    `INSERT INTO batches (id, zone_id, status, stop_count, total_km, total_courier_fee_cents, created_at)
     VALUES (?, ?, 'open', ?, ?, ?, ?)`
  ).run(batchId, input.zoneId, input.orderIds.length, input.totalKm, input.totalCourierFeeCents, now());

  input.orderIds.forEach((orderId, index) => {
    db.prepare(`UPDATE orders SET batch_id = ?, batch_sequence = ? WHERE id = ?`).run(
      batchId,
      index + 1,
      orderId
    );
    logEvent(orderId, "batched", { batchId, sequence: index + 1 });
  });

  return batchId;
}

export function getBatchById(batchId: string) {
  const r = db.prepare(`SELECT * FROM batches WHERE id = ?`).get(batchId) as any;
  if (!r) return null;
  return {
    id: r.id,
    courierId: r.courier_id,
    zoneId: r.zone_id,
    status: r.status,
    stopCount: r.stop_count,
    totalKm: r.total_km,
    totalCourierFeeCents: r.total_courier_fee_cents,
    createdAt: r.created_at,
    assignedAt: r.assigned_at,
  };
}

export function listOpenBatches() {
  return db
    .prepare(`SELECT * FROM batches WHERE status = 'open' ORDER BY created_at ASC`)
    .all()
    .map(toPlain) as any[];
}

export function listOrdersInBatch(batchId: string) {
  return db
    .prepare(`${ORDER_SELECT} WHERE o.batch_id = ? ORDER BY o.batch_sequence ASC`)
    .all(batchId)
    .map(mapOrder);
}

/** Courier takes an entire multi-stop route in one tap. */
export function assignBatchToCourier(batchId: string, courierId: string) {
  const result = db
    .prepare(`UPDATE batches SET courier_id = ?, status = 'assigned', assigned_at = ? WHERE id = ? AND status = 'open'`)
    .run(courierId, now(), batchId);
  if (result.changes === 0) return false;

  const orders = listOrdersInBatch(batchId);
  for (const o of orders) {
    if (o!.status === "PENDING") {
      db.prepare(
        `UPDATE orders SET courier_id = ?, status = 'ASSIGNED', assigned_at = ? WHERE id = ? AND status = 'PENDING'`
      ).run(courierId, now(), o!.id);
      markOffersResolvedForOrder(o!.id, courierId);
      logEvent(o!.id, "courier_assigned", { courierId, viaBatch: batchId });
    }
  }
  return true;
}

/** Pending, un-batched orders — the input to the batching pass. */
export function listBatchableOrders(limit = 100) {
  return db
    .prepare(
      `${ORDER_SELECT}
       WHERE o.status = 'PENDING' AND o.courier_id IS NULL AND o.batch_id IS NULL
         AND o.service_type IN ('BATCH','NEXT_DAY')
       ORDER BY o.created_at ASC LIMIT ?`
    )
    .all(limit)
    .map(mapOrder);
}

// ---------------------------------------------------------------------------
// Surge pricing
// ---------------------------------------------------------------------------

export function setZoneSurge(zoneId: string, multiplier: number, note: string | null, adminUserId: string) {
  db.prepare(`UPDATE zones SET surge_multiplier = ?, surge_note = ? WHERE id = ?`).run(
    multiplier,
    note,
    zoneId
  );
  writeAudit(adminUserId, "zone_surge_set", "zone", zoneId, `x${multiplier} ${note ?? ""}`);
}

// ---------------------------------------------------------------------------
// Merchant API keys + webhooks
// ---------------------------------------------------------------------------

export function createApiKey(input: {
  merchantId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  webhookUrl?: string | null;
}) {
  const keyId = id();
  db.prepare(
    `INSERT INTO api_keys (id, merchant_id, name, key_prefix, key_hash, webhook_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(keyId, input.merchantId, input.name, input.keyPrefix, input.keyHash, input.webhookUrl ?? null, now());
  return keyId;
}

export function listApiKeys(merchantId: string) {
  return db
    .prepare(
      `SELECT id, name, key_prefix as keyPrefix, webhook_url as webhookUrl,
              last_used_at as lastUsedAt, revoked_at as revokedAt, created_at as createdAt
       FROM api_keys WHERE merchant_id = ? ORDER BY created_at DESC`
    )
    .all(merchantId)
    .map(toPlain) as any[];
}

export function findApiKeyByHash(keyHash: string) {
  const r = db
    .prepare(`SELECT * FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL`)
    .get(keyHash) as any;
  return r ? toPlain(r) : null;
}

export function touchApiKey(keyId: string) {
  db.prepare(`UPDATE api_keys SET last_used_at = ? WHERE id = ?`).run(now(), keyId);
}

export function revokeApiKey(keyId: string, merchantId: string) {
  const result = db
    .prepare(`UPDATE api_keys SET revoked_at = ? WHERE id = ? AND merchant_id = ? AND revoked_at IS NULL`)
    .run(now(), keyId, merchantId);
  return result.changes > 0;
}

export function setWebhookUrl(keyId: string, merchantId: string, url: string | null) {
  db.prepare(`UPDATE api_keys SET webhook_url = ? WHERE id = ? AND merchant_id = ?`).run(
    url,
    keyId,
    merchantId
  );
}

export function webhookUrlsForMerchant(merchantId: string): string[] {
  return (
    db
      .prepare(
        `SELECT DISTINCT webhook_url FROM api_keys
         WHERE merchant_id = ? AND revoked_at IS NULL AND webhook_url IS NOT NULL`
      )
      .all(merchantId) as any[]
  ).map((r) => r.webhook_url);
}

export function recordWebhookDelivery(input: {
  merchantId: string;
  orderId?: string | null;
  event: string;
  url: string;
  status: string;
  responseCode?: number | null;
  error?: string | null;
}) {
  db.prepare(
    `INSERT INTO webhook_deliveries (id, merchant_id, order_id, event, url, status, response_code, error, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id(),
    input.merchantId,
    input.orderId ?? null,
    input.event,
    input.url,
    input.status,
    input.responseCode ?? null,
    input.error ?? null,
    now()
  );
}

export function listWebhookDeliveries(merchantId: string, limit = 50) {
  return db
    .prepare(`SELECT * FROM webhook_deliveries WHERE merchant_id = ? ORDER BY created_at DESC LIMIT ?`)
    .all(merchantId, limit)
    .map(toPlain) as any[];
}

// ---------------------------------------------------------------------------
// Recurring deliveries
// ---------------------------------------------------------------------------

export function createRecurringOrder(input: any) {
  const recurringId = id();
  db.prepare(
    `INSERT INTO recurring_orders
      (id, merchant_id, zone_id, label, pickup_address, pickup_lat, pickup_lng,
       dropoff_address, dropoff_lat, dropoff_lng, customer_name, customer_phone,
       customer_email, delivery_instructions, service_type, days_of_week,
       window_hour_start, window_hour_end, active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
  ).run(
    recurringId,
    input.merchantId,
    input.zoneId,
    input.label,
    input.pickupAddress,
    input.pickupLat ?? null,
    input.pickupLng ?? null,
    input.dropoffAddress,
    input.dropoffLat ?? null,
    input.dropoffLng ?? null,
    input.customerName,
    input.customerPhone ?? null,
    input.customerEmail ?? null,
    input.deliveryInstructions ?? null,
    input.serviceType ?? "SAME_DAY",
    input.daysOfWeek,
    input.windowHourStart ?? null,
    input.windowHourEnd ?? null,
    now()
  );
  return recurringId;
}

export function listRecurringOrders(merchantId: string) {
  return db
    .prepare(`SELECT * FROM recurring_orders WHERE merchant_id = ? ORDER BY created_at DESC`)
    .all(merchantId)
    .map(toPlain) as any[];
}

export function listActiveRecurringOrders() {
  return db.prepare(`SELECT * FROM recurring_orders WHERE active = 1`).all().map(toPlain) as any[];
}

export function setRecurringActive(recurringId: string, merchantId: string, active: boolean) {
  const result = db
    .prepare(`UPDATE recurring_orders SET active = ? WHERE id = ? AND merchant_id = ?`)
    .run(active ? 1 : 0, recurringId, merchantId);
  return result.changes > 0;
}

export function markRecurringGenerated(recurringId: string, dateStr: string) {
  db.prepare(`UPDATE recurring_orders SET last_generated_date = ? WHERE id = ?`).run(dateStr, recurringId);
}

// ---------------------------------------------------------------------------
// Challenges (courier bonus campaigns)
// ---------------------------------------------------------------------------

export function createChallenge(input: {
  title: string;
  description?: string;
  targetDeliveries: number;
  bonusCents: number;
  startsAt: string;
  endsAt: string;
  minTier?: string;
}) {
  const challengeId = id();
  db.prepare(
    `INSERT INTO challenges (id, title, description, target_deliveries, bonus_cents, starts_at, ends_at, min_tier, active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
  ).run(
    challengeId,
    input.title,
    input.description ?? null,
    input.targetDeliveries,
    input.bonusCents,
    input.startsAt,
    input.endsAt,
    input.minTier ?? "STARTER",
    now()
  );
  return challengeId;
}

export function listActiveChallenges() {
  return db
    .prepare(`SELECT * FROM challenges WHERE active = 1 AND ends_at >= ? ORDER BY ends_at ASC`)
    .all(now())
    .map(toPlain) as any[];
}

export function listAllChallenges() {
  return db.prepare(`SELECT * FROM challenges ORDER BY created_at DESC`).all().map(toPlain) as any[];
}

/** How many deliveries a courier completed inside a challenge window. */
export function courierDeliveriesBetween(courierId: string, startsAt: string, endsAt: string) {
  const r = db
    .prepare(
      `SELECT COUNT(*) as c FROM orders
       WHERE courier_id = ? AND status = 'DELIVERED' AND delivered_at >= ? AND delivered_at <= ?`
    )
    .get(courierId, startsAt, endsAt) as any;
  return r?.c ?? 0;
}

export function hasClaimedChallenge(challengeId: string, courierId: string) {
  return !!db
    .prepare(`SELECT 1 FROM challenge_claims WHERE challenge_id = ? AND courier_id = ?`)
    .get(challengeId, courierId);
}

export function claimChallenge(challengeId: string, courierId: string, bonusCents: number) {
  try {
    db.prepare(
      `INSERT INTO challenge_claims (id, challenge_id, courier_id, bonus_cents, claimed_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id(), challengeId, courierId, bonusCents, now());
    db.prepare(`UPDATE courier_profiles SET payout_balance_cents = payout_balance_cents + ? WHERE id = ?`).run(
      bonusCents,
      courierId
    );
    return true;
  } catch {
    return false; // unique index — already claimed
  }
}

export function listChallengeClaims(courierId: string) {
  return db
    .prepare(
      `SELECT c.title, cc.bonus_cents as bonusCents, cc.claimed_at as claimedAt
       FROM challenge_claims cc JOIN challenges c ON c.id = cc.challenge_id
       WHERE cc.courier_id = ? ORDER BY cc.claimed_at DESC`
    )
    .all(courierId)
    .map(toPlain) as any[];
}

// ---------------------------------------------------------------------------
// Courier earnings balance & payout requests
// ---------------------------------------------------------------------------

/** Unpaid delivery earnings + bonuses, minus anything already requested. */
export function courierEarningsSummary(courierId: string) {
  const delivered = db
    .prepare(
      `SELECT COALESCE(SUM(courier_fee_cents),0) as total, COUNT(*) as count
       FROM orders WHERE courier_id = ? AND status = 'DELIVERED'`
    )
    .get(courierId) as any;

  const bonuses = db
    .prepare(`SELECT COALESCE(SUM(bonus_cents),0) as total FROM challenge_claims WHERE courier_id = ?`)
    .get(courierId) as any;

  const paidOut = db
    .prepare(
      `SELECT COALESCE(SUM(amount_cents),0) as total FROM payout_requests
       WHERE courier_id = ? AND status IN ('requested','approved','paid')`
    )
    .get(courierId) as any;

  const grossCents = (delivered?.total ?? 0) + (bonuses?.total ?? 0);
  return {
    deliveries: delivered?.count ?? 0,
    deliveryEarningsCents: delivered?.total ?? 0,
    bonusCents: bonuses?.total ?? 0,
    grossCents,
    paidOrPendingCents: paidOut?.total ?? 0,
    availableCents: Math.max(0, grossCents - (paidOut?.total ?? 0)),
  };
}

export function createPayoutRequest(input: {
  courierId: string;
  amountCents: number;
  feeCents: number;
  method: "instant" | "weekly";
}) {
  const requestId = id();
  db.prepare(
    `INSERT INTO payout_requests (id, courier_id, amount_cents, fee_cents, method, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'requested', ?)`
  ).run(requestId, input.courierId, input.amountCents, input.feeCents, input.method, now());
  return requestId;
}

export function listPayoutRequests(courierId?: string) {
  const sql = courierId
    ? `SELECT p.*, u.email as courierEmail FROM payout_requests p
       JOIN courier_profiles c ON c.id = p.courier_id JOIN users u ON u.id = c.user_id
       WHERE p.courier_id = ? ORDER BY p.created_at DESC`
    : `SELECT p.*, u.email as courierEmail FROM payout_requests p
       JOIN courier_profiles c ON c.id = p.courier_id JOIN users u ON u.id = c.user_id
       ORDER BY p.created_at DESC LIMIT 100`;
  const stmt = db.prepare(sql);
  return (courierId ? stmt.all(courierId) : stmt.all()).map(toPlain) as any[];
}

export function setPayoutStatus(requestId: string, status: string, adminUserId: string, note?: string) {
  const result = db
    .prepare(`UPDATE payout_requests SET status = ?, note = ?, processed_at = ? WHERE id = ?`)
    .run(status, note ?? null, now(), requestId);
  if (result.changes > 0) writeAudit(adminUserId, `payout_${status}`, "payout", requestId, note);
  return result.changes > 0;
}

// ---------------------------------------------------------------------------
// Demand heat map
// ---------------------------------------------------------------------------

/**
 * Where the work is right now: pending/active orders grouped by pickup
 * area, so couriers can position themselves instead of guessing.
 */
export function demandHeatmap(hours = 24) {
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  return db
    .prepare(
      `SELECT z.id as zoneId, z.name as zoneName, z.city as city,
              z.surge_multiplier as surgeMultiplier,
              COUNT(*) as orderCount,
              SUM(CASE WHEN o.status = 'PENDING' THEN 1 ELSE 0 END) as waiting,
              AVG(o.pickup_lat) as avgLat, AVG(o.pickup_lng) as avgLng
       FROM orders o JOIN zones z ON z.id = o.zone_id
       WHERE o.created_at >= ?
       GROUP BY z.id ORDER BY waiting DESC, orderCount DESC`
    )
    .all(since)
    .map(toPlain) as any[];
}

/** Busiest hours of day over the last N days — "when should I work?" */
export function demandByHour(days = 7) {
  const since = new Date(Date.now() - days * 86400 * 1000).toISOString();
  return db
    .prepare(
      `SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour, COUNT(*) as orderCount
       FROM orders WHERE created_at >= ? GROUP BY hour ORDER BY hour ASC`
    )
    .all(since)
    .map(toPlain) as any[];
}

// ---------------------------------------------------------------------------
// Support tickets — wired into the admin panel
// ---------------------------------------------------------------------------

export function createTicket(input: {
  openedByRole: "merchant" | "courier" | "customer" | "admin";
  openedByUserId?: string | null;
  contactEmail?: string | null;
  orderId?: string | null;
  category: string;
  subject: string;
  body: string;
  priority?: string;
}) {
  const ticketId = id();
  const reference = `SD-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  db.prepare(
    `INSERT INTO support_tickets
      (id, reference, opened_by_role, opened_by_user_id, contact_email, order_id, category, subject, priority, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`
  ).run(
    ticketId,
    reference,
    input.openedByRole,
    input.openedByUserId ?? null,
    input.contactEmail ?? null,
    input.orderId ?? null,
    input.category,
    input.subject,
    input.priority ?? "normal",
    now(),
    now()
  );

  addTicketMessage({
    ticketId,
    senderRole: input.openedByRole,
    senderUserId: input.openedByUserId ?? null,
    body: input.body,
  });

  return { ticketId, reference };
}

export function addTicketMessage(input: {
  ticketId: string;
  senderRole: string;
  senderUserId?: string | null;
  body: string;
  internal?: boolean;
}) {
  db.prepare(
    `INSERT INTO ticket_messages (id, ticket_id, sender_role, sender_user_id, body, internal, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id(),
    input.ticketId,
    input.senderRole,
    input.senderUserId ?? null,
    input.body,
    input.internal ? 1 : 0,
    now()
  );
  db.prepare(`UPDATE support_tickets SET updated_at = ? WHERE id = ?`).run(now(), input.ticketId);
}

export function listTickets(status?: string) {
  const sql = status
    ? `SELECT t.*, o.customer_name as orderCustomer FROM support_tickets t
       LEFT JOIN orders o ON o.id = t.order_id WHERE t.status = ? ORDER BY t.updated_at DESC LIMIT 100`
    : `SELECT t.*, o.customer_name as orderCustomer FROM support_tickets t
       LEFT JOIN orders o ON o.id = t.order_id ORDER BY t.updated_at DESC LIMIT 100`;
  const stmt = db.prepare(sql);
  return (status ? stmt.all(status) : stmt.all()).map(toPlain) as any[];
}

export function getTicket(ticketId: string) {
  const r = db.prepare(`SELECT * FROM support_tickets WHERE id = ?`).get(ticketId) as any;
  return r ? toPlain(r) : null;
}

export function getTicketByReference(reference: string) {
  const r = db.prepare(`SELECT * FROM support_tickets WHERE reference = ?`).get(reference) as any;
  return r ? toPlain(r) : null;
}

export function listTicketMessages(ticketId: string, includeInternal: boolean) {
  const sql = includeInternal
    ? `SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC`
    : `SELECT * FROM ticket_messages WHERE ticket_id = ? AND internal = 0 ORDER BY created_at ASC`;
  return db.prepare(sql).all(ticketId).map(toPlain) as any[];
}

export function listTicketsForUser(userId: string) {
  return db
    .prepare(`SELECT * FROM support_tickets WHERE opened_by_user_id = ? ORDER BY updated_at DESC LIMIT 50`)
    .all(userId)
    .map(toPlain) as any[];
}

export function setTicketStatus(ticketId: string, status: string, adminUserId: string) {
  db.prepare(
    `UPDATE support_tickets SET status = ?, updated_at = ?, resolved_at = CASE WHEN ? IN ('resolved','closed') THEN ? ELSE resolved_at END WHERE id = ?`
  ).run(status, now(), status, now(), ticketId);
  writeAudit(adminUserId, `ticket_${status}`, "ticket", ticketId);
}

export function ticketCounts() {
  return db
    .prepare(`SELECT status, COUNT(*) as count FROM support_tickets GROUP BY status`)
    .all()
    .map(toPlain) as any[];
}

// ---------------------------------------------------------------------------
// Disputes & claims
// ---------------------------------------------------------------------------

export function createDispute(input: {
  orderId: string;
  raisedBy: string;
  reason: string;
  orderAmountCents?: number | null;
}) {
  const disputeId = id();
  db.prepare(
    `INSERT INTO disputes (id, order_id, raised_by, reason, status, order_amount_cents, created_at)
     VALUES (?, ?, ?, ?, 'open', ?, ?)`
  ).run(disputeId, input.orderId, input.raisedBy, input.reason, input.orderAmountCents ?? null, now());
  logEvent(input.orderId, "dispute_opened", { raisedBy: input.raisedBy, reason: input.reason });
  return disputeId;
}

export function listDisputes(status?: string) {
  const sql = status
    ? `SELECT d.*, o.customer_name as customerName, o.merchant_id as merchantId, m.business_name as merchantName
       FROM disputes d JOIN orders o ON o.id = d.order_id
       LEFT JOIN merchant_profiles m ON m.id = o.merchant_id
       WHERE d.status = ? ORDER BY d.created_at DESC LIMIT 100`
    : `SELECT d.*, o.customer_name as customerName, o.merchant_id as merchantId, m.business_name as merchantName
       FROM disputes d JOIN orders o ON o.id = d.order_id
       LEFT JOIN merchant_profiles m ON m.id = o.merchant_id
       ORDER BY d.created_at DESC LIMIT 100`;
  const stmt = db.prepare(sql);
  return (status ? stmt.all(status) : stmt.all()).map(toPlain) as any[];
}

export function resolveDispute(input: {
  disputeId: string;
  status: "resolved" | "rejected";
  resolution: string;
  resolutionAmountCents?: number | null;
  adminUserId: string;
}) {
  const result = db
    .prepare(
      `UPDATE disputes SET status = ?, resolution = ?, resolution_amount_cents = ?, resolved_by = ?, resolved_at = ?
       WHERE id = ? AND status = 'open'`
    )
    .run(
      input.status,
      input.resolution,
      input.resolutionAmountCents ?? null,
      input.adminUserId,
      now(),
      input.disputeId
    );
  if (result.changes > 0) {
    writeAudit(input.adminUserId, `dispute_${input.status}`, "dispute", input.disputeId, input.resolution);
  }
  return result.changes > 0;
}

// ---------------------------------------------------------------------------
// Compliance — age verification, temperature, pay transparency
// ---------------------------------------------------------------------------

export function recordAgeVerification(
  orderId: string,
  courierId: string,
  method: "id_checked" | "refused_underage" | "refused_no_id"
) {
  const result = db
    .prepare(
      `UPDATE orders SET age_verified_at = ?, age_verification_method = ? WHERE id = ? AND courier_id = ?`
    )
    .run(now(), method, orderId, courierId);
  if (result.changes > 0) logEvent(orderId, "age_verification", { method });
  return result.changes > 0;
}

export function setCourierEquipment(courierId: string, hasInsulatedBag: boolean) {
  db.prepare(`UPDATE courier_profiles SET has_insulated_bag = ? WHERE id = ?`).run(
    hasInsulatedBag ? 1 : 0,
    courierId
  );
}

export function setUserLocale(userId: string, locale: string) {
  db.prepare(`UPDATE users SET locale = ? WHERE id = ?`).run(locale, userId);
}

/**
 * Ontario's Digital Platform Workers' Rights Act requires platforms to be
 * transparent about pay and about time actually worked. This computes the
 * engaged time and effective hourly rate for a courier's period, which is
 * what the pay-transparency statement shows them.
 */
export function courierPayTransparency(courierId: string, days = 14) {
  const since = new Date(Date.now() - days * 86400 * 1000).toISOString();
  const rows = db
    .prepare(
      `SELECT assigned_at, delivered_at, courier_fee_cents
       FROM orders
       WHERE courier_id = ? AND status = 'DELIVERED' AND assigned_at >= ? AND delivered_at IS NOT NULL`
    )
    .all(courierId, since) as any[];

  let engagedMinutes = 0;
  let earningsCents = 0;
  for (const r of rows) {
    const mins = (new Date(r.delivered_at).getTime() - new Date(r.assigned_at).getTime()) / 60000;
    if (mins > 0 && mins < 480) engagedMinutes += mins; // ignore obviously broken spans
    earningsCents += r.courier_fee_cents ?? 0;
  }

  const bonuses = db
    .prepare(
      `SELECT COALESCE(SUM(bonus_cents),0) as total FROM challenge_claims
       WHERE courier_id = ? AND claimed_at >= ?`
    )
    .get(courierId, since) as any;

  const totalCents = earningsCents + (bonuses?.total ?? 0);
  const hours = engagedMinutes / 60;

  // An effective hourly rate only means something once there's a real
  // amount of engaged time behind it. Dividing $6 of earnings by six
  // seconds of work produces a number in the tens of thousands, which
  // would be nonsense on a pay-transparency statement — so below half an
  // hour of engaged time we report no rate rather than a fantasy one.
  const MIN_HOURS_FOR_RATE = 0.5;
  const hasEnoughData = hours >= MIN_HOURS_FOR_RATE;

  return {
    periodDays: days,
    deliveries: rows.length,
    engagedHours: Math.round(hours * 100) / 100,
    engagedMinutes: Math.round(engagedMinutes),
    deliveryEarningsCents: earningsCents,
    bonusCents: bonuses?.total ?? 0,
    totalCents,
    effectiveHourlyCents: hasEnoughData ? Math.round(totalCents / hours) : null,
    rateUnavailableReason: hasEnoughData
      ? null
      : "Not enough engaged time yet this period to show a meaningful hourly rate.",
  };
}

// ---------------------------------------------------------------------------
// Courier supply forecasting
// ---------------------------------------------------------------------------

/**
 * How many couriers each zone is likely to need, by hour, based on the
 * last few weeks of demand and average deliveries per courier-hour.
 */
export function supplyForecast(lookbackDays = 21, deliveriesPerCourierHour = 2.5) {
  const since = new Date(Date.now() - lookbackDays * 86400 * 1000).toISOString();
  const rows = db
    .prepare(
      `SELECT z.id as zoneId, z.city as city, z.name as zoneName,
              CAST(strftime('%H', o.created_at) AS INTEGER) as hour,
              COUNT(*) as orders
       FROM orders o JOIN zones z ON z.id = o.zone_id
       WHERE o.created_at >= ?
       GROUP BY z.id, hour`
    )
    .all(since) as any[];

  const weeks = Math.max(1, lookbackDays / 7);

  return rows
    .map((r) => {
      const avgPerHour = r.orders / (lookbackDays || 1);
      const couriersNeeded = Math.max(1, Math.ceil(avgPerHour / deliveriesPerCourierHour));
      return {
        zoneId: r.zoneId,
        city: r.city,
        zoneName: r.zoneName,
        hour: r.hour,
        avgOrdersPerDay: Math.round(avgPerHour * 10) / 10,
        weeklyOrders: Math.round(r.orders / weeks),
        couriersNeeded,
      };
    })
    .sort((a, b) => b.avgOrdersPerDay - a.avgOrdersPerDay);
}

export function orderStatusCounts() {
  return db
    .prepare(`SELECT status, COUNT(*) as count FROM orders GROUP BY status`)
    .all()
    .map(toPlain) as { status: OrderStatus; count: number }[];
}

export function countMerchants() {
  return (db.prepare(`SELECT COUNT(*) as c FROM merchant_profiles`).get() as any).c as number;
}

export function countCouriers() {
  return (db.prepare(`SELECT COUNT(*) as c FROM courier_profiles`).get() as any).c as number;
}

export function countOnlineCouriers() {
  return (
    db.prepare(`SELECT COUNT(*) as c FROM courier_profiles WHERE is_online = 1`).get() as any
  ).c as number;
}

/**
 * The numbers an ops person actually acts on, in one round trip.
 *
 * A dashboard of totals (how many merchants exist, how many orders ever)
 * tells you nothing you can do something about. These are the queues: work
 * waiting on a human, deliveries stuck without a courier, and today's volume
 * to compare against.
 */
export function opsSummary() {
  const one = (sql: string, ...params: any[]) =>
    ((db.prepare(sql).get(...params) as any)?.c ?? 0) as number;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const since = todayStart.toISOString();

  const revenue = db
    .prepare(
      `SELECT COALESCE(SUM(price_cents),0) as gross, COALESCE(SUM(platform_fee_cents),0) as net
       FROM orders WHERE status = 'DELIVERED' AND delivered_at >= ?`
    )
    .get(since) as any;

  return {
    pendingMerchants: one(`SELECT COUNT(*) as c FROM merchant_profiles WHERE kyb_status = 'pending'`),
    pendingCouriers: one(`SELECT COUNT(*) as c FROM courier_profiles WHERE approval_status = 'pending'`),
    unassignedOrders: one(
      `SELECT COUNT(*) as c FROM orders WHERE status = 'PENDING' AND courier_id IS NULL`
    ),
    inFlightOrders: one(
      `SELECT COUNT(*) as c FROM orders WHERE status IN ('ASSIGNED','PICKED_UP','IN_TRANSIT')`
    ),
    openDisputes: one(`SELECT COUNT(*) as c FROM disputes WHERE status = 'open'`),
    openTickets: one(`SELECT COUNT(*) as c FROM support_tickets WHERE status = 'open'`),
    pendingPayouts: one(`SELECT COUNT(*) as c FROM payout_requests WHERE status = 'requested'`),
    deliveredToday: one(
      `SELECT COUNT(*) as c FROM orders WHERE status = 'DELIVERED' AND delivered_at >= ?`,
      since
    ),
    failedToday: one(
      `SELECT COUNT(*) as c FROM orders WHERE status = 'FAILED' AND created_at >= ?`,
      since
    ),
    grossTodayCents: (revenue?.gross ?? 0) as number,
    platformTodayCents: (revenue?.net ?? 0) as number,
  };
}

// ---------------------------------------------------------------------------
// Customer accounts & loyalty
//
// Orders are booked by merchants on behalf of a customer — there's no
// customer_user_id on the orders table (see the schema note in db.ts). A
// CUSTOMER account therefore isn't the thing that *creates* orders, it's a
// layer on top: sign in, see every past delivery that was sent to your
// email/phone, save addresses for next time, and track loyalty points +
// referrals. Matching is done on contact info, not a foreign key.
// ---------------------------------------------------------------------------

function generateReferralCode(): string {
  for (let i = 0; i < 10; i++) {
    const code = randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
    const exists = db.prepare(`SELECT 1 FROM loyalty_accounts WHERE referral_code = ?`).get(code);
    if (!exists) return code;
  }
  // Astronomically unlikely to be reached, but never loop forever.
  return randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

function mapLoyaltyAccount(r: any) {
  if (!r) return null;
  return {
    userId: r.user_id,
    points: r.points,
    referralCode: r.referral_code,
    referredByUserId: r.referred_by_user_id,
    createdAt: r.created_at,
  };
}

/** Creates the loyalty account row a CUSTOMER user needs from day one — every CUSTOMER gets one at signup. */
export function createLoyaltyAccount(userId: string, referredByUserId?: string | null) {
  const code = generateReferralCode();
  db.prepare(
    `INSERT INTO loyalty_accounts (user_id, points, referral_code, referred_by_user_id, created_at)
     VALUES (?, 0, ?, ?, ?)`
  ).run(userId, code, referredByUserId ?? null, now());
  return code;
}

export function getLoyaltyAccount(userId: string) {
  return mapLoyaltyAccount(db.prepare(`SELECT * FROM loyalty_accounts WHERE user_id = ?`).get(userId));
}

export function getLoyaltyAccountByReferralCode(code: string) {
  return mapLoyaltyAccount(
    db.prepare(`SELECT * FROM loyalty_accounts WHERE referral_code = ?`).get(code.trim().toUpperCase())
  );
}

/** Adds (or, with a negative amount, deducts) points and records why. Self-heals a missing account instead of throwing. */
export function addLoyaltyPoints(userId: string, points: number, reason: string, orderId?: string) {
  if (!points) return;
  if (!getLoyaltyAccount(userId)) createLoyaltyAccount(userId);
  db.prepare(`UPDATE loyalty_accounts SET points = points + ? WHERE user_id = ?`).run(points, userId);
  db.prepare(
    `INSERT INTO loyalty_transactions (id, user_id, order_id, points, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id(), userId, orderId ?? null, points, reason, now());
}

export function listLoyaltyTransactions(userId: string, limit = 50) {
  return db
    .prepare(`SELECT * FROM loyalty_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`)
    .all(userId, limit)
    .map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      orderId: r.order_id,
      points: r.points,
      reason: r.reason,
      createdAt: r.created_at,
    }));
}

function findCustomerByContact(email?: string | null, phone?: string | null) {
  if (email) {
    const u = mapUser(
      db.prepare(`SELECT * FROM users WHERE role = 'CUSTOMER' AND email = ?`).get(email.trim().toLowerCase())
    );
    if (u) return u;
  }
  if (phone) {
    const u = mapUser(db.prepare(`SELECT * FROM users WHERE role = 'CUSTOMER' AND phone = ?`).get(phone));
    if (u) return u;
  }
  return null;
}

/** 1 point per dollar spent (min 1), credited automatically the moment an order is marked delivered — only if the guest's email/phone matches a registered CUSTOMER account. */
export function awardLoyaltyPointsForOrder(order: { id: string; customerEmail?: string | null; customerPhone?: string | null; priceCents: number }) {
  const customer = findCustomerByContact(order.customerEmail, order.customerPhone);
  if (!customer) return;
  const points = Math.max(1, Math.round((order.priceCents ?? 0) / 100));
  addLoyaltyPoints(customer.id, points, "order_delivered", order.id);
}

/** Creates a CUSTOMER user + their loyalty account, and applies a referral bonus on both sides when a valid code is given. */
export function createCustomerUser(input: {
  email: string;
  phone?: string;
  fullName?: string;
  passwordHash: string;
  referralCode?: string;
}) {
  const userId = createUser({
    email: input.email,
    phone: input.phone,
    fullName: input.fullName,
    passwordHash: input.passwordHash,
    role: "CUSTOMER",
  });

  let referredBy: string | null = null;
  if (input.referralCode) {
    const referrer = getLoyaltyAccountByReferralCode(input.referralCode);
    if (referrer && referrer.userId !== userId) referredBy = referrer.userId;
  }

  createLoyaltyAccount(userId, referredBy);
  if (referredBy) {
    addLoyaltyPoints(userId, 50, "referred_signup_bonus");
    addLoyaltyPoints(referredBy, 100, "referral_bonus");
  }

  return userId;
}

function mapCustomerAddress(r: any) {
  return {
    id: r.id,
    userId: r.user_id,
    label: r.label,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    isDefault: !!r.is_default,
    createdAt: r.created_at,
  };
}

export function createCustomerAddress(userId: string, input: { label?: string; address: string; lat?: number | null; lng?: number | null; isDefault?: boolean }) {
  const addrId = id();
  if (input.isDefault) db.prepare(`UPDATE customer_addresses SET is_default = 0 WHERE user_id = ?`).run(userId);
  db.prepare(
    `INSERT INTO customer_addresses (id, user_id, label, address, lat, lng, is_default, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(addrId, userId, input.label?.trim() || "Home", input.address, input.lat ?? null, input.lng ?? null, input.isDefault ? 1 : 0, now());
  return addrId;
}

export function listCustomerAddresses(userId: string) {
  return db
    .prepare(`SELECT * FROM customer_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`)
    .all(userId)
    .map(mapCustomerAddress);
}

export function deleteCustomerAddress(addressId: string, userId: string) {
  return db.prepare(`DELETE FROM customer_addresses WHERE id = ? AND user_id = ?`).run(addressId, userId).changes > 0;
}

export function setDefaultCustomerAddress(addressId: string, userId: string) {
  db.prepare(`UPDATE customer_addresses SET is_default = 0 WHERE user_id = ?`).run(userId);
  return (
    db.prepare(`UPDATE customer_addresses SET is_default = 1 WHERE id = ? AND user_id = ?`).run(addressId, userId)
      .changes > 0
  );
}

/** Every past delivery sent to this customer's email or phone — the only link between a guest order and an account. */
export function listOrdersForCustomer(contact: { email?: string | null; phone?: string | null }, limit = 100) {
  const email = contact.email?.trim().toLowerCase() ?? "";
  const phone = contact.phone ?? "";
  return db
    .prepare(
      `SELECT o.*, m.business_name as merchant_business_name
       FROM orders o
       LEFT JOIN merchant_profiles m ON m.id = o.merchant_id
       WHERE o.deleted_at IS NULL
         AND ((? != '' AND LOWER(o.customer_email) = ?) OR (? != '' AND o.customer_phone = ?))
       ORDER BY o.created_at DESC
       LIMIT ?`
    )
    .all(email, email, phone, phone, limit)
    .map((r: any) => ({ ...mapOrder(r), merchantBusinessName: r.merchant_business_name }));
}

// ---------------------------------------------------------------------------
// Merchant analytics — revenue trend, top customers, success rate, and a
// cost breakdown by service type, all scoped to one merchant's own orders.
// ---------------------------------------------------------------------------

export function merchantAnalytics(merchantId: string, days = 14) {
  const since = new Date(Date.now() - days * 86400 * 1000).toISOString();

  const dailySeries = db
    .prepare(
      `SELECT date(created_at) as date,
              COUNT(*) as orders,
              COALESCE(SUM(price_cents), 0) as revenueCents,
              SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered
       FROM orders
       WHERE merchant_id = ? AND deleted_at IS NULL AND created_at >= ?
       GROUP BY date(created_at)
       ORDER BY date ASC`
    )
    .all(merchantId, since)
    .map(toPlain) as any[];

  const topCustomers = db
    .prepare(
      `SELECT customer_name as customerName,
              COUNT(*) as orderCount,
              COALESCE(SUM(price_cents), 0) as spentCents
       FROM orders
       WHERE merchant_id = ? AND deleted_at IS NULL
       GROUP BY customer_name
       ORDER BY spentCents DESC
       LIMIT 8`
    )
    .all(merchantId)
    .map(toPlain) as any[];

  const outcomes = db
    .prepare(
      `SELECT status, COUNT(*) as c FROM orders
       WHERE merchant_id = ? AND deleted_at IS NULL AND status IN ('DELIVERED','FAILED','RETURNED','CANCELLED')
       GROUP BY status`
    )
    .all(merchantId)
    .map(toPlain) as { status: string; c: number }[];
  const delivered = outcomes.find((o) => o.status === "DELIVERED")?.c ?? 0;
  const terminal = outcomes.reduce((sum, o) => sum + o.c, 0);
  const successRate = terminal > 0 ? Math.round((delivered / terminal) * 1000) / 10 : null;

  const serviceBreakdown = db
    .prepare(
      `SELECT service_type as serviceType,
              COUNT(*) as orderCount,
              COALESCE(SUM(price_cents), 0) as revenueCents
       FROM orders
       WHERE merchant_id = ? AND deleted_at IS NULL
       GROUP BY service_type
       ORDER BY revenueCents DESC`
    )
    .all(merchantId)
    .map(toPlain) as any[];

  return { dailySeries, topCustomers, successRate, delivered, terminal, serviceBreakdown };
}

// ---------------------------------------------------------------------------
// Smart incentives — automatic surge bonuses. The dispatch tick calls
// maybeCreateSurgeAlert() for every zone it sees; this decides on its own
// whether that zone's backlog deserves a fresh alert (and won't spam one if
// an unexpired alert is already live for that zone).
// ---------------------------------------------------------------------------

const SURGE_WAITING_THRESHOLD = Number(process.env.SURGE_WAITING_THRESHOLD ?? 3);
const SURGE_BONUS_CENTS = Number(process.env.SURGE_BONUS_CENTS ?? 500);
const SURGE_ALERT_TTL_MINUTES = Number(process.env.SURGE_ALERT_TTL_MINUTES ?? 30);

export function listActiveSurgeAlerts() {
  return db
    .prepare(
      `SELECT sa.*, z.name as zone_name, z.city as city
       FROM surge_alerts sa JOIN zones z ON z.id = sa.zone_id
       WHERE sa.expires_at > ?
       ORDER BY sa.waiting_count DESC`
    )
    .all(now())
    .map((r: any) => ({
      id: r.id,
      zoneId: r.zone_id,
      zoneName: r.zone_name,
      city: r.city,
      waitingCount: r.waiting_count,
      bonusCents: r.bonus_cents,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
    }));
}

/** Called from the dispatch tick with each zone's current waiting count. Returns the new alert if one was just created, otherwise null. */
export function maybeCreateSurgeAlert(zoneId: string, waitingCount: number) {
  if (waitingCount < SURGE_WAITING_THRESHOLD) return null;

  const existing = db
    .prepare(`SELECT 1 FROM surge_alerts WHERE zone_id = ? AND expires_at > ?`)
    .get(zoneId, now());
  if (existing) return null;

  const alertId = id();
  const expiresAt = new Date(Date.now() + SURGE_ALERT_TTL_MINUTES * 60_000).toISOString();
  db.prepare(
    `INSERT INTO surge_alerts (id, zone_id, waiting_count, bonus_cents, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(alertId, zoneId, waitingCount, SURGE_BONUS_CENTS, expiresAt, now());

  const zone = getZoneById(zoneId);
  return { id: alertId, zoneId, zoneName: zone?.name, city: zone?.city, waitingCount, bonusCents: SURGE_BONUS_CENTS, expiresAt };
}

/** Every currently-online courier's userId — who a surge push should reach. */
export function onlineCourierUserIds(): string[] {
  return db
    .prepare(`SELECT user_id FROM courier_profiles WHERE is_online = 1 AND deleted_at IS NULL`)
    .all()
    .map((r: any) => r.user_id);
}

/** Zones with at least one order still waiting for a courier right now — the input maybeCreateSurgeAlert acts on. */
export function pendingCountsByZone() {
  return db
    .prepare(
      `SELECT zone_id as zoneId, COUNT(*) as waitingCount
       FROM orders
       WHERE status = 'PENDING' AND deleted_at IS NULL AND zone_id IS NOT NULL
       GROUP BY zone_id`
    )
    .all()
    .map(toPlain) as { zoneId: string; waitingCount: number }[];
}

// ---------------------------------------------------------------------------
// Rider safety — emergency contact, SOS incidents, and short-lived
// unauthenticated "share my live location" links.
// ---------------------------------------------------------------------------

export function setCourierEmergencyContact(courierId: string, name: string, phone: string) {
  db.prepare(`UPDATE courier_profiles SET emergency_contact_name = ?, emergency_contact_phone = ? WHERE id = ?`).run(
    name,
    phone,
    courierId
  );
}

export function adminUserIds(): string[] {
  return db
    .prepare(`SELECT id FROM users WHERE role = 'ADMIN' AND status = 'active'`)
    .all()
    .map((r: any) => r.id);
}

function mapSafetyIncident(r: any) {
  return {
    id: r.id,
    courierId: r.courier_id,
    orderId: r.order_id,
    lat: r.lat,
    lng: r.lng,
    note: r.note,
    status: r.status,
    createdAt: r.created_at,
    resolvedAt: r.resolved_at,
    resolvedBy: r.resolved_by,
    courierFullName: r.courier_full_name,
    courierPhone: r.courier_phone,
    courierEmail: r.courier_email,
  };
}

/** Records an SOS press. Returns the incident so the caller can push-notify with its id/location. */
export function createSafetyIncident(input: { courierId: string; orderId?: string | null; lat?: number | null; lng?: number | null; note?: string | null }) {
  const incidentId = id();
  db.prepare(
    `INSERT INTO safety_incidents (id, courier_id, order_id, lat, lng, note, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'open', ?)`
  ).run(incidentId, input.courierId, input.orderId ?? null, input.lat ?? null, input.lng ?? null, input.note ?? null, now());
  return incidentId;
}

export function listOpenSafetyIncidents() {
  return db
    .prepare(
      `SELECT si.*, cp.full_name as courier_full_name, cp.phone as courier_phone, u.email as courier_email
       FROM safety_incidents si
       JOIN courier_profiles cp ON cp.id = si.courier_id
       JOIN users u ON u.id = cp.user_id
       WHERE si.status != 'resolved'
       ORDER BY si.created_at DESC`
    )
    .all()
    .map(mapSafetyIncident);
}

export function resolveSafetyIncident(incidentId: string, adminUserId: string) {
  return (
    db
      .prepare(`UPDATE safety_incidents SET status = 'resolved', resolved_at = ?, resolved_by = ? WHERE id = ?`)
      .run(now(), adminUserId, incidentId).changes > 0
  );
}

function generateShareToken(): string {
  return randomUUID().replace(/-/g, "");
}

/** A courier-initiated link, valid for `minutes`, that shows their live position to whoever holds it — no login required. */
export function createLocationShare(courierId: string, minutes = 60) {
  const shareId = id();
  const token = generateShareToken();
  const expiresAt = new Date(Date.now() + minutes * 60_000).toISOString();
  db.prepare(`INSERT INTO location_shares (id, token, courier_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`).run(
    shareId,
    token,
    courierId,
    expiresAt,
    now()
  );
  return { token, expiresAt };
}

export function getActiveLocationShare(token: string) {
  const r = db.prepare(`SELECT * FROM location_shares WHERE token = ? AND expires_at > ?`).get(token, now()) as any;
  if (!r) return null;
  return { id: r.id, courierId: r.courier_id, expiresAt: r.expires_at, createdAt: r.created_at };
}

// ---------------------------------------------------------------------------
// Chat — per-role read state (for "seen" receipts). Typing indicators are
// deliberately kept out of the database: they're seconds-lived, and a
// module-level map in lib/typing.ts is all that's needed for a single
// Next.js instance — no point persisting something that's stale before the
// write even finishes.
// ---------------------------------------------------------------------------

/** Marks this role as having read the thread up to now — call this whenever they fetch the thread. */
export function markMessagesRead(orderId: string, role: string) {
  db.prepare(
    `INSERT INTO message_read_state (order_id, role, last_read_at) VALUES (?, ?, ?)
     ON CONFLICT(order_id, role) DO UPDATE SET last_read_at = excluded.last_read_at`
  ).run(orderId, role, now());
}

/** Every role's last-read timestamp for this order's thread, as a lookup map. */
export function getReadState(orderId: string): Record<string, string> {
  const rows = db.prepare(`SELECT role, last_read_at FROM message_read_state WHERE order_id = ?`).all(orderId) as {
    role: string;
    last_read_at: string;
  }[];
  return Object.fromEntries(rows.map((r) => [r.role, r.last_read_at]));
}
