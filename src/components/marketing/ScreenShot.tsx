import Image from "next/image";

/**
 * A product screenshot inside a browser chrome frame. These are real
 * captures of the running app, not mockups — so what a merchant sees on
 * the marketing site is what they actually get.
 */
export default function ScreenShot({
  src,
  alt,
  label,
  priority = false,
}: {
  src: string;
  alt: string;
  label?: string;
  priority?: boolean;
}) {
  return (
    <figure className="hero-shadow overflow-hidden rounded-2xl border border-line bg-surface">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-line bg-bg-soft px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-fg/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-fg/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-fg/15" />
        </span>
        {label && (
          <span className="mx-auto truncate rounded-md bg-fg/[0.06] px-3 py-1 text-[11px] text-fg-subtle">
            {label}
          </span>
        )}
      </div>

      <Image
        src={src}
        alt={alt}
        width={1180}
        height={760}
        priority={priority}
        className="w-full"
        sizes="(max-width: 768px) 100vw, 640px"
      />
    </figure>
  );
}
