import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-6">
          <span className="font-bold text-brand">SwiftDrop · Merchant</span>
          <Link href="/merchant/dashboard" className="text-sm text-gray-600 hover:text-brand">
            Dashboard
          </Link>
          <Link href="/merchant/orders" className="text-sm text-gray-600 hover:text-brand">
            Orders
          </Link>
          <Link href="/merchant/orders/new" className="text-sm text-gray-600 hover:text-brand">
            New delivery
          </Link>
          <span className="ml-auto">
            <SignOutButton />
          </span>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
