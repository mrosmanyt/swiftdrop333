import type { Metadata } from "next";
import { getContent } from "./content";

type SeoPage = "home" | "features" | "pricing" | "couriers" | "privacy" | "contact";

/**
 * Title, description and share picture for one public page, from
 * Website → Google & sharing. Until that section is published this returns
 * exactly the titles and descriptions the pages always had.
 */
export async function pageMetadata(page: SeoPage): Promise<Metadata> {
  const seo = (await getContent("seo")) as Record<string, string>;
  const title = seo[`${page}Title`];
  const description = seo[`${page}Description`];
  const image = seo[`${page}Image`];
  if (!image) return { title, description };
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "";
  const url = base ? `${base.replace(/\/$/, "")}${image}` : image;
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url }] },
    twitter: { card: "summary_large_image", title, description, images: [url] },
  };
}
