import { findUserById } from "@/lib/repo";

/**
 * Account-state guards. A merchant can't create deliveries until their
 * business is verified, and a courier can't go online or accept offers
 * until their documents are approved. Both are also blocked if the user
 * account itself has been suspended by an admin.
 */

export interface MerchantLike {
  id: string;
  userId: string;
  kybStatus: string;
  deletedAt?: string | null;
}

export interface CourierLike {
  id: string;
  userId: string;
  approvalStatus: string;
  deletedAt?: string | null;
}

export async function merchantBlockReason(merchant: MerchantLike | null): Promise<string | null> {
  if (!merchant) return "No merchant profile found for this account.";
  const user = await findUserById(merchant.userId);
  if (!user || user.status !== "active" || merchant.deletedAt) {
    return "This account is suspended. Contact SwiftDrop support.";
  }
  if (merchant.kybStatus === "rejected") {
    return "Your business verification was rejected. Contact support to re-apply.";
  }
  if (merchant.kybStatus !== "verified") {
    return "Your business is still being verified. You'll be able to book deliveries as soon as it's approved.";
  }
  return null;
}

export async function courierBlockReason(courier: CourierLike | null): Promise<string | null> {
  if (!courier) return "No courier profile found for this account.";
  const user = await findUserById(courier.userId);
  if (!user || user.status !== "active" || courier.deletedAt) {
    return "This account is suspended. Contact SwiftDrop support.";
  }
  if (courier.approvalStatus === "rejected") {
    return "Your application was rejected. Contact support if you think this is a mistake.";
  }
  if (courier.approvalStatus === "suspended") {
    return "Your courier account is suspended. Contact support.";
  }
  if (courier.approvalStatus !== "approved") {
    return "Your application is under review. You'll be able to go online once it's approved.";
  }
  return null;
}
