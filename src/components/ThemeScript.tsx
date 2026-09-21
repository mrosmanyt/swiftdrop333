/**
 * Runs before first paint so the correct theme is applied immediately —
 * without this, a dark-mode visitor sees a white flash on every page load.
 *
 * Order of preference: the visitor's saved choice, then their OS setting.
 */
const script = `
(function () {
  try {
    var stored = localStorage.getItem('swiftdrop-theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
