import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";

/**
 * Data-access layer — every API route and page in the app goes through
 * these functions instead of writing raw SQL inline. This is the single
 * place to swap SQLite for Postgres later without touching route/page code.
 */

export type Role = "MERCHANT" | "COURIER" | "ADMIN";
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
    reviewedAt: r.reviewed_at ?? null,
    payoutMethod: r.payout_method,
    shopifyDomain: r.shopify_domain,
    createdAt: r.created_at,
    email: r.email, // present when joined with users
    userStatus: r.user_status, // present when joined with users
    orderCount: r.order_count, // present when joined with count
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
       ORDER BY m.created_at DESC`
    )
    .all();
  return rows.map(mapMerchant);
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
    lastLat: r.last_lat,
    lastLng: r.last_lng,
    lastLocationAt: r.last_location_at,
    createdAt: r.created_at,
    email: r.email,
    userStatus: r.user_status,
    orderCount: r.order_count,
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
       ${opts.onlineOnly ? "WHERE c.is_online = 1" : ""}
       ORDER BY CASE c.tier WHEN 'PRO' THEN 3 WHEN 'GOLD' THEN 2 WHEN 'SILVER' THEN 1 ELSE 0 END DESC`
    )
    .all();
  return rows.map(mapCourier);
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
  return db.prepare(`${ORDER_SELECT} ORDER BY o.created_at DESC LIMIT ?`).all(limit).map(mapOrder);
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
  if (result.changes > 0) logEvent(orderId, "status_change", { status: "DELIVERED" });
  return result.changes > 0;
}

export function markOrderFailed(orderId: string, courierId: string, reason: string) {
  const result = db
    .prepare(`UPDATE orders SET status = 'FAILED' WHERE id = ? AND courier_id = ?`)
    .run(orderId, courierId);
  if (result.changes > 0) logEvent(orderId, "status_change", { status: "FAILED", reason });
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
      `SELECT o.*, f.id as offer_id, f.expires_at as offer_expires_at
       FROM offers f
       JOIN orders o ON o.id = f.order_id
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
