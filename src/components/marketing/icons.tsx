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
};

export const iconPath = (name: string) => ICON_PATHS[name] ?? ICON_PATHS.pin;
