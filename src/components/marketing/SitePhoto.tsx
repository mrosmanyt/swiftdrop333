import Image from "next/image";
import { SITE_IMAGES, type SiteImageKey } from "@/lib/site/images";

/** True when a photograph has been supplied for this slot. */
export function hasPhoto(key: SiteImageKey) {
  return Boolean(SITE_IMAGES[key]);
}

/**
 * Fills its (relatively positioned) parent with one of the site photos.
 * Renders nothing when that photo hasn't been supplied, so callers can put
 * their fallback behind it.
 */
export default function SitePhoto({
  name,
  alt,
  priority = false,
  sizes = "100vw",
  className = "",
}: {
  name: SiteImageKey;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const src = SITE_IMAGES[name];
  if (!src) return null;
  return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={`object-cover ${className}`} />;
}

/**
 * A photo that sits flush across the top of a marketing <Card>. Renders
 * nothing when the photo hasn't been supplied, so the card keeps its
 * original icon-and-text look.
 */
export function CardPhoto({
  name,
  alt = "",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  aspect = "aspect-[16/10]",
}: {
  name: SiteImageKey | undefined;
  alt?: string;
  sizes?: string;
  aspect?: string;
}) {
  if (!name || !SITE_IMAGES[name]) return null;
  return (
    <div className={`relative -mx-6 -mt-6 mb-6 overflow-hidden sm:-mx-7 sm:-mt-7 ${aspect}`}>
      <SitePhoto
        name={name}
        alt={alt}
        sizes={sizes}
        className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
    </div>
  );
}
