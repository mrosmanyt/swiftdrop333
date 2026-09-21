import Link from "next/link";
import AuthShell from "@/components/AuthShell";

export default function SignupChoicePage() {
  return (
    <AuthShell
      title="Join SwiftDrop"
      subtitle="Tell us how you want to use SwiftDrop."
      width="lg"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/signup/merchant"
          className="group rounded-xl border border-line bg-bg p-5 transition hover:border-accent"
        >
          <span className="text-[15px] font-semibold text-fg">I&apos;m a business</span>
          <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">
            Send same-day and next-day deliveries to your customers. We verify your business
            first — usually within one working day.
          </p>
        </Link>

        <Link
          href="/signup/courier"
          className="group rounded-xl border border-line bg-bg p-5 transition hover:border-accent"
        >
          <span className="text-[15px] font-semibold text-fg">I want to deliver</span>
          <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">
            Earn on your own schedule by bike, scooter, car or van. You&apos;ll upload your
            documents after signing up.
          </p>
        </Link>
      </div>
    </AuthShell>
  );
}
