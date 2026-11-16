import type { Metadata, Viewport } from "next";
import { SHARE_IMAGE } from "@/lib/site/images";
import localFont from "next/font/local";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import ThemeScript from "@/components/ThemeScript";
import InstallAppPrompt from "@/components/InstallAppPrompt";

// Archivo (SIL Open Font License), self-hosted. One variable file carries
// both the regular width used for text and the condensed cut used for
// headings, so the whole site is a single typeface.
const archivo = localFont({
  src: "./fonts/Archivo-latin-wdth.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

export const metadata: Metadata = {
  // Absolute base for share-picture links. On Vercel, Next.js falls back to
  // the deployment URL when NEXT_PUBLIC_APP_URL isn't set.
  ...(process.env.NEXT_PUBLIC_APP_URL ? { metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL) } : {}),
  openGraph: {
    type: "website",
    siteName: "SwiftDrop",
    images: [{ url: SHARE_IMAGE, width: 1200, height: 630, alt: "A SwiftDrop courier handing a parcel to a customer at his door" }],
  },
  twitter: { card: "summary_large_image", images: [SHARE_IMAGE] },
  title: "SwiftDrop — Local Delivery, Done Right",
  description:
    "Same-day and next-day local delivery for Canadian businesses. Flat rates, no commission on what you sell, and live GPS tracking your customers can follow.",
  // Registers the app as installable (Add to Home Screen / desktop install)
  // for every visitor — customers, merchants, drivers, and admin all land
  // on this same root layout, so the manifest and icons apply everywhere.
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SwiftDrop",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B3B2E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={archivo.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <InstallAppPrompt />
      </body>
    </html>
  );
}
