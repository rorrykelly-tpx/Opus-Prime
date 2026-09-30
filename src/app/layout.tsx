import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learning Centre",
  description: "Discover, search and organise learning and development content.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
