import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Do‘kon Hisob", template: "%s · Do‘kon Hisob" },
  description: "Savdo va ombor hisobi",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#205D47",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
