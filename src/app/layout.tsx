import type { Metadata } from "next";
import { DM_Sans, Oswald, Playfair_Display } from "next/font/google";

import { THEME_INIT_SCRIPT } from "@/lib/pathways/storage";

import "./globals.css";

// Brand fonts, self-hosted by next/font so pages don't call Google at runtime.
const dmSans = DM_Sans({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-dm-sans",
  display: "swap",
});
const oswald = Oswald({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-oswald",
  display: "swap",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Learning Centre", template: "%s | TPXimpact learning pathways" },
  description: "Discover, search and organise learning and development content.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // The theme script sets data-theme before React hydrates, so the attribute can differ.
    <html
      lang="en-GB"
      className={`${dmSans.variable} ${oswald.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
