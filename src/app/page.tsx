import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <h1 className="text-4xl font-bold text-brand">SwiftDrop</h1>
        <p className="mt-3 text-lg text-gray-600">
          Local delivery for Canadian businesses — with real-time courier tracking for everyone
          involved: the customer, the merchant, and ops.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PortalCard href="/merchant/dashboard" title="Merchant Portal" description="Create and track deliveries for your business." />
        <PortalCard href="/driver/offers" title="Driver App" description="Go online, accept offers, deliver, get paid." />
        <PortalCard href="/admin/dashboard" title="Admin Dashboard" description="Ops, live map, zones, pricing, payouts." />
        <PortalCard href="/login" title="Sign in" description="Merchant, driver, or admin — one login page." />
      </div>

      <p className="text-sm text-gray-400">
        Seeded test accounts: merchant@example.com · courier@example.com · admin@example.com
        (password: password123) — run <code>npm run seed</code> first.
      </p>
    </main>
  );
}

function PortalCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-brand hover:shadow-md"
    >
      <h2 className="font-semibold text-brand">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </Link>
  );
}
