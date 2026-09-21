import { cookies, headers } from "next/headers";
import { getOrderById } from "@/lib/repo";
import { isLocale, localeFromHeader, t, Locale } from "@/lib/i18n";
import TrackingLive from "@/components/TrackingLive";
import SupportWidget from "@/components/SupportWidget";
import LanguageSwitcher from "@/components/LanguageSwitcher";

/**
 * No-login customer tracking page, in the customer's language.
 * Locale: ?lang= → saved cookie → Accept-Language → English.
 */
export default async function TrackOrderPage({
  params,
  searchParams,
}: {
  params: { orderId: string };
  searchParams: { lang?: string };
}) {
  const cookieLocale = cookies().get("locale")?.value;
  const locale: Locale = isLocale(searchParams.lang)
    ? searchParams.lang
    : isLocale(cookieLocale)
    ? cookieLocale
    : localeFromHeader(headers().get("accept-language"));

  const order = getOrderById(params.orderId);

  if (!order) {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-xl font-semibold">{t(locale, "track.notFound")}</h1>
        <p className="mt-2 text-fg-muted">
          Create an order from the Merchant Portal, then open the tracking link it gives you.
        </p>
      </main>
    );
  }

  return (
    <main>
      <div className="mx-auto flex max-w-md items-center justify-end px-6 pt-4">
        <LanguageSwitcher current={locale} />
      </div>

      <TrackingLive orderId={order.id} initialOrder={order as any} locale={locale} />

      <div className="mx-auto max-w-md px-6 pb-12">
        <SupportWidget
          orderId={order.id}
          needsEmail
          labels={{
            title: t(locale, "support.title"),
            subject: t(locale, "support.subject"),
            message: t(locale, "support.message"),
            email: t(locale, "support.email"),
            submit: t(locale, "support.submit"),
            sent: t(locale, "support.sent"),
          }}
        />
      </div>
    </main>
  );
}
