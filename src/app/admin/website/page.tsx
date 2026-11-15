import Link from "next/link";
import { Card, PageHeader, Stat } from "@/components/portal/ui";
import { SignOutEverywhere } from "@/components/cms/BackupPanel";
import { staffPage } from "@/lib/cms/staff";
import { can, staffRoleLabel } from "@/lib/cms/permissions";
import { analyticsSummary } from "@/lib/cms/analytics";
import { enquirySummary } from "@/lib/cms/enquiries";
import { ENQUIRY_STATUSES } from "@/lib/cms/enquiryStatus";

export const dynamic = "force-dynamic";

/** Website overview: visitors, enquiries and what needs attention today. */
export default async function WebsiteOverviewPage() {
  const staff = await staffPage("analytics.view");
  const seeEnquiries = can(staff.staffRole, "enquiries.view");
  const [stats, leads] = await Promise.all([analyticsSummary(30), seeEnquiries ? enquirySummary(30) : null]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website overview"
        subtitle={
          <>
            Last 30 days · signed in as {staff.email} ({staffRoleLabel(staff.staffRole)})
          </>
        }
        action={<SignOutEverywhere />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Page views" value={stats.views.toLocaleString()} hint="Every page opened" />
        <Stat label="Visitors" value={stats.visitors.toLocaleString()} hint="Counted once per day, no cookies" />
        {leads && (
          <>
            <Stat label="Follow-ups due today" value={leads.dueToday} tone={leads.dueToday ? "warn" : "default"} href="/admin/website/enquiries" />
            <Stat label="Follow-ups overdue" value={leads.overdue} tone={leads.overdue ? "danger" : "default"} href="/admin/website/enquiries" />
          </>
        )}
      </div>

      {leads && (
        <Card title="Enquiry pipeline" action={<Link href="/admin/website/enquiries" className="text-[13px] text-accent hover:underline">Open inbox</Link>}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {ENQUIRY_STATUSES.map((s) => (
              <div key={s.value} className="rounded-xl border border-line p-3">
                <p className="text-[22px] font-semibold leading-none text-fg">{leads.counts[s.value] ?? 0}</p>
                <p className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11.5px] font-medium ${s.tone}`}>{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Page views per day">
          <Bars data={stats.series.map((d) => ({ day: d.day, n: d.views }))} unit="views" />
        </Card>
        {leads && (
          <Card title="Enquiries per day">
            <Bars data={leads.series} unit="enquiries" />
          </Card>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Most viewed pages">
          <Ranked rows={stats.pages} empty="No visits recorded yet." />
        </Card>
        <Card title="Devices">
          <Ranked rows={stats.devices.map((d) => ({ ...d, label: d.label[0].toUpperCase() + d.label.slice(1) }))} empty="No visits recorded yet." />
        </Card>
        <Card title="Where visitors came from">
          <Ranked rows={stats.referrers} empty="No visits from other websites yet." />
        </Card>
      </div>

      <Card title="Quick links">
        <div className="flex flex-wrap gap-2">
          {can(staff.staffRole, "content.view") && <QuickLink href="/admin/website/content">Edit website content</QuickLink>}
          {can(staff.staffRole, "content.view") && <QuickLink href="/admin/website/content/announcement">Announcement bar</QuickLink>}
          {seeEnquiries && <QuickLink href="/admin/website/enquiries">Enquiries inbox</QuickLink>}
          {can(staff.staffRole, "staff.manage") && <QuickLink href="/admin/website/staff">Staff &amp; roles</QuickLink>}
          {can(staff.staffRole, "backup.manage") && <QuickLink href="/admin/website/backup">Backup</QuickLink>}
          <QuickLink href="/">View the website</QuickLink>
        </div>
      </Card>
    </div>
  );
}

function QuickLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] text-fg-muted transition-colors hover:border-accent/40 hover:text-fg">
      {children}
    </Link>
  );
}

/** Plain bar chart: one bar per day, the number on hover and for screen readers. */
function Bars({ data, unit }: { data: { day: string; n: number }[]; unit: string }) {
  const max = Math.max(1, ...data.map((d) => d.n));
  const total = data.reduce((sum, d) => sum + d.n, 0);
  if (!total) return <p className="py-8 text-center text-[13px] text-fg-subtle">Nothing recorded in the last 30 days yet.</p>;
  return (
    <div>
      <div className="flex h-36 items-end gap-[3px]" role="img" aria-label={`${total} ${unit} in the last ${data.length} days`}>
        {data.map((d) => (
          <div key={d.day} title={`${d.day}: ${d.n} ${unit}`} className="flex h-full flex-1 items-end">
            <div className="w-full rounded-t bg-accent-solid" style={{ height: `${d.n ? Math.max(3, (d.n / max) * 100) : 0}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11.5px] text-fg-subtle">
        <span>{data[0].day.slice(5)}</span>
        <span>most in a day: {max}</span>
        <span>{data[data.length - 1].day.slice(5)}</span>
      </div>
    </div>
  );
}

function Ranked({ rows, empty }: { rows: { label: string; n: number }[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  if (!rows.length) return <p className="py-6 text-center text-[13px] text-fg-subtle">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between gap-3 text-[13.5px]">
            <span className="truncate text-fg">{r.label}</span>
            <span className="tabular-nums text-fg-muted">{r.n.toLocaleString()}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-fg/10">
            <div className="h-full rounded-full bg-accent-solid" style={{ width: `${(r.n / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
