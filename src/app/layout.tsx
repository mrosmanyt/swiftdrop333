import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import ThemeScript from "@/components/ThemeScript";
import InstallAppPrompt from "@/components/InstallAppPrompt";

export const metadata: Metadata = {
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
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
