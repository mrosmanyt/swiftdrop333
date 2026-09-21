// Plain link styled as a button — a real download link works everywhere
// (including as a right-click "save as") without any client-side JS, unlike
// building the CSV in the browser and triggering a blob download.
export default function DownloadCsvButton({ href, label = "Download CSV" }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      download
      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-fg hover:bg-surface-2"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {label}
    </a>
  );
}
