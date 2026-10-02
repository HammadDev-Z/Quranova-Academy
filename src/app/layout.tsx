import type { Metadata, Viewport } from "next";
import { Amiri, Inter, Playfair_Display } from "next/font/google";
import { siteStatic } from "@/content/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const amiri = Amiri({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--font-amiri", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteStatic.url),
  title: {
    default: `${siteStatic.name} | One-to-One Online Quran Classes`,
    template: `%s | ${siteStatic.name}`,
  },
  description: siteStatic.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: siteStatic.name,
    locale: "en_GB",
    title: `${siteStatic.name} | One-to-One Online Quran Classes`,
    description: siteStatic.description,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0f6b49",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${playfair.variable} ${amiri.variable}`}>
      <body>{children}</body>
    </html>
  );
}
