import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — SwiftDrop",
  description: "What personal information SwiftDrop collects, why, how long it's kept, and how to have it deleted.",
};

/**
 * Plain-language privacy notice describing what the code actually does.
 * Have it reviewed by a Canadian privacy lawyer before relying on it
 * (PIPEDA; Quebec Law 25 if you serve Quebec).
 */
const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: "What we never collect",
    p: [
      "SwiftDrop does not collect or store payment card numbers, bank account numbers, transit or institution numbers, void cheques, or Social Insurance Numbers. When payments and payouts are enabled they are handled by a payment provider, and those details stay with that provider.",
    ],
  },
  {
    h: "What we collect, and why",
    p: [
      "Customers: the name, delivery address, phone number and email a business gives us for your delivery, so a courier can reach you and you can track it. If you create an account: your email, name, optional phone number and any addresses you save.",
      "Couriers: name, contact details, vehicle details, licence and insurance expiry dates, the last four characters of your licence and policy numbers, an emergency contact you choose to add, and your location while you are online or on a delivery. Uploaded licence/insurance documents are used only to verify your application.",
      "Businesses: business name, contact person, business phone and address, and your CRA business number.",
    ],
  },
  {
    h: "How long we keep it",
    p: [
      "Identity documents are stored encrypted and the files are deleted automatically 30 days after your application is reviewed (or after 180 days if it is never completed). We keep only the decision and expiry dates.",
      "Courier location points are kept for 24 hours. Delivery photos are deleted after 90 days. Chat messages are deleted 90 days after a delivery ends. SMS/email delivery logs never contain message text and are deleted after 90 days.",
      "A customer's phone number, email and delivery instructions are removed from a delivery 12 months after it ends. Order totals and dates are kept without contact details because businesses must keep financial records.",
    ],
  },
  {
    h: "Who can see it",
    p: [
      "The business that booked a delivery and the courier assigned to it see what they need for that delivery. A tracking link shows only the delivery status, map, first name and addresses — never phone numbers or emails. SwiftDrop staff access identity documents only to review applications, and every view is logged.",
    ],
  },
  {
    h: "Deleting your data",
    p: [
      "Customers can delete their account at any time from Account & privacy; it is erased immediately. Couriers and businesses can close their account there too: sign-in stops right away and personal details and documents are permanently erased after 30 days, so pending payouts or claims can be settled first. You can also ask our support team to delete your data or tell you what we hold about you.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
      <p className="mt-3 text-fg-muted">
        How SwiftDrop handles personal information, in plain language.
      </p>
      <div className="mt-10 space-y-10">
        {SECTIONS.map((s) => (
          <section key={s.h}>
            <h2 className="text-xl font-semibold">{s.h}</h2>
            <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-fg-muted">
              {s.p.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
