import Link from "next/link";

export default function SignupChoicePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand">Join SwiftDrop</h1>
        <p className="mt-2 text-gray-600">Tell us how you want to use SwiftDrop.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/signup/merchant"
          className="rounded-xl border border-gray-200 bg-white p-6 transition hover:border-brand hover:shadow-md"
        >
          <h2 className="font-semibold text-brand">I&apos;m a business</h2>
          <p className="mt-1 text-sm text-gray-500">
            Send same-day and next-day deliveries to your customers. We verify your business
            first — usually within one working day.
          </p>
        </Link>

        <Link
          href="/signup/courier"
          className="rounded-xl border border-gray-200 bg-white p-6 transition hover:border-brand hover:shadow-md"
        >
          <h2 className="font-semibold text-brand">I want to deliver</h2>
          <p className="mt-1 text-sm text-gray-500">
            Earn on your own schedule by bike, scooter, car or van. You&apos;ll upload your
            documents after signing up.
          </p>
        </Link>
      </div>

      <p className="text-center text-sm text-gray-400">
        Already have an account?{" "}
        <Link href="/login" className="text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
