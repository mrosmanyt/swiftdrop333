/**
 * The line icons used on feature cards. Content (which is editable in the
 * admin console) refers to them by name; the drawings stay here in code.
 */
export const ICON_PATHS: Record<string, React.ReactNode> = {
  pin: (
    <>
      <path d="M12 21s-7-5.6-7-11a7 7 0 1 1 14 0c0 5.4-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  dollar: (
    <>
      <path d="M12 2v20" />
      <path d="M17 6.5c0-2-2.2-3-5-3s-5 .9-5 3 2.2 2.8 5 3.3 5 1.2 5 3.4-2.2 3.3-5 3.3-5-1.2-5-3.3" />
    </>
  ),
  batch: (
    <>
      <path d="M4 7h7" />
      <path d="M4 12h12" />
      <path d="M4 17h16" />
      <circle cx="19" cy="7" r="2" />
    </>
  ),
  camera: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2.5" />
      <circle cx="12" cy="13" r="3.2" />
      <path d="M8 6l1.5-2h5L16 6" />
    </>
  ),
  code: (
    <>
      <path d="M8 17 3 12l5-5" />
      <path d="m16 7 5 5-5 5" />
      <path d="M13.5 4.5 10.5 19.5" />
    </>
  ),
  pulse: (
    <>
      <path d="M3 12h4l3-8 4 16 3-8h4" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8.5 6H15a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6.5" />
    </>
  ),
  return: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </>
  ),
  id: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <circle cx="9" cy="11" r="2.2" />
      <path d="M5.5 16c.8-1.6 2-2.3 3.5-2.3s2.7.7 3.5 2.3M15 10h4M15 13.5h4" />
    </>
  ),
  snow: (
    <>
      <path d="M12 2v20M4.2 7l15.6 10M19.8 7 4.2 17" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3 3.5 18.5h17L12 3Z" />
      <path d="M12 10v3.5M12 16.5h.01" />
    </>
  ),
  nocut: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </>
  ),
  wallet: (
    <>
      <rect x="2.5" y="6" width="19" height="13" rx="2.5" />
      <path d="M2.5 10.5h19" />
      <path d="M7 15h3" />
    </>
  ),
  calendar: (
    <>
      <path d="M9 11.5 11 13.5l4-4.5" />
      <rect x="3" y="4" width="18" height="17" rx="2.5" />
      <path d="M8 2v4M16 2v4" />
    </>
  ),
  basket: (
    <>
      <path d="M3 9h18l-1.6 9.2a2 2 0 0 1-2 1.8H6.6a2 2 0 0 1-2-1.8L3 9Z" />
      <path d="m8 9 3-5M16 9l-3-5M9 13v3M12 13v3M15 13v3" />
    </>
  ),
  cake: (
    <>
      <path d="M4 20h16v-7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7Z" />
      <path d="M4 16c1.3 0 1.3-1 2.7-1s1.3 1 2.6 1 1.4-1 2.700-1 1.3 1 2.700 1 1.3-1 2.6-1 1.4 1 2.700 1" />
      <path d="M12 11V7M12 4.5v.01" />
    </>
  ),
  box: (
    <>
      <path d="m3 7.5 9-4.5 9 4.5v9l-9 4.5-9-4.5v-9Z" />
      <path d="m3 7.5 9 4.5 9-4.5M12 12v9" />
    </>
  ),
  flower: (
    <>
      <circle cx="12" cy="8" r="2.2" />
      <path d="M12 5.800V3.5M14 7l2-1.2M14 9l2 1.2M12 10.2v2.3M10 9l-2 1.2M10 7 8 5.800" />
      <path d="M12 12.5V21M12 17c-2.5 0-4-1.2-4.5-3 2.5 0 4 1.2 4.5 3ZM12 19c2.5 0 4-1.2 4.5-3-2.5 0-4 1.2-4.5 3Z" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </>
  ),
  paw: (
    <>
      <circle cx="7" cy="10" r="1.6" />
      <circle cx="10.5" cy="6.5" r="1.6" />
      <circle cx="14.5" cy="6.5" r="1.6" />
      <circle cx="18" cy="10" r="1.6" />
      <path d="M8.5 16.5c0-2.2 1.800-4 4-4s4 1.800 4 4c0 1.5-1.2 2.5-2.6 2.5-.6 0-1-.3-1.4-.3s-.8.3-1.4.3c-1.4 0-2.6-1-2.6-2.5Z" />
    </>
  ),
  glass: (
    <>
      <path d="M7 3h10l-1 7a4 4 0 0 1-8 0L7 3Z" />
      <path d="M12 14v7M8.5 21h7M7.5 7h9" />
    </>
  ),
  pill: (
    <>
      <rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)" />
      <path d="m8.5 8.5 7 7" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" />
      <path d="M5 19c3-5 6-8 10-10" />
    </>
  ),
};

export const iconPath = (name: string) => ICON_PATHS[name] ?? ICON_PATHS.pin;
