import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lunchmate",
  description: "Lunchmate cloud food business website, dashboard, and 3D brand experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#fbf6ec] text-zinc-900">{children}</body>
    </html>
  );
}
