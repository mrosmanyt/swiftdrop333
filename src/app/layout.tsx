import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "SwiftDrop — Local Delivery, Done Right",
  description:
    "Same-day and next-day local delivery for Canadian businesses — merchant, driver, customer and admin, all in one platform, with live GPS tracking.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
