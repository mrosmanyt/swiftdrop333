import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import ThemeScript from "@/components/ThemeScript";

export const metadata: Metadata = {
  title: "SwiftDrop — Local Delivery, Done Right",
  description:
    "Same-day and next-day local delivery for Canadian businesses. Flat rates, no commission on what you sell, and live GPS tracking your customers can follow.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
