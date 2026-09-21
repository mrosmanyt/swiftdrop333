import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import DriverLocationControl from "@/components/DriverLocationControl";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-4">
          <span className="font-bold text-brand">SwiftDrop · Driver</span>
          <Link href="/driver/offers" className="text-sm text-gray-600 hover:text-brand">
            Offers
          </Link>
          <Link href="/driver/earnings" className="text-sm text-gray-600 hover:text-brand">
            Earnings
          </Link>
          <Link href="/driver/documents" className="text-sm text-gray-600 hover:text-brand">
            Documents
          </Link>
          <span className="ml-auto">
            <SignOutButton />
          </span>
        </div>
        <div className="mx-auto mt-2 max-w-3xl">
          <DriverLocationControl />
        </div>
      </nav>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </div>
  );
}
