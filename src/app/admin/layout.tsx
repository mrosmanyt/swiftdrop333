import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6">
          <span className="font-bold text-brand">SwiftDrop · Admin</span>
          <Link href="/admin/dashboard" className="text-sm text-gray-600 hover:text-brand">
            Ops Overview
          </Link>
          <Link href="/admin/live-map" className="text-sm text-gray-600 hover:text-brand">
            Live Map
          </Link>
          <Link href="/admin/orders" className="text-sm text-gray-600 hover:text-brand">
            Orders
          </Link>
          <Link href="/admin/applications" className="text-sm text-gray-600 hover:text-brand">
            Applications
          </Link>
          <Link href="/admin/merchants" className="text-sm text-gray-600 hover:text-brand">
            Merchants
          </Link>
          <Link href="/admin/couriers" className="text-sm text-gray-600 hover:text-brand">
            Couriers
          </Link>
          <Link href="/admin/zones" className="text-sm text-gray-600 hover:text-brand">
            Zones & Pricing
          </Link>
          <span className="ml-auto">
            <SignOutButton />
          </span>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
