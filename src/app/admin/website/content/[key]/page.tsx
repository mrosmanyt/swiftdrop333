import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/ui";
import CmsEditor from "@/components/cms/CmsEditor";
import { staffPage } from "@/lib/cms/staff";
import { can } from "@/lib/cms/permissions";
import { sectionDef } from "@/lib/cms/sections";
import { getEditorState, isSectionKey } from "@/lib/cms/content";

export const dynamic = "force-dynamic";

/** The editor for one section of the website. */
export default async function WebsiteSectionPage({ params }: { params: { key: string } }) {
  const def = sectionDef(params.key);
  if (!def || !isSectionKey(params.key)) notFound();
  const isSetting = def.key === "alerts";
  const staff = await staffPage(isSetting ? "settings.edit" : "content.view");
  const state = await getEditorState(def.key);

  return (
    <div className="space-y-5">
      <Link href="/admin/website/content" className="text-[13px] text-fg-muted hover:text-fg">
        ← All website content
      </Link>
      <PageHeader
        title={def.title}
        subtitle={def.about}
        action={
          def.preview && (
            <a href={def.preview} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] text-fg-muted hover:text-fg">
              View on website ↗
            </a>
          )
        }
      />
      <CmsEditor
        def={def}
        initial={state}
        canEdit={can(staff.staffRole, isSetting ? "settings.edit" : "content.edit")}
        canPublish={can(staff.staffRole, isSetting ? "settings.edit" : "content.publish")}
      />
    </div>
  );
}
