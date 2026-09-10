import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RapidLab Care",
  description: "OCR-assisted laboratory record management for healthcare staff.",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
