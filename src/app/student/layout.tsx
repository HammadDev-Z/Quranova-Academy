import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "Student Portal", template: "%s | Quranova Student Portal" },
  robots: { index: false, follow: false },
  manifest: "/pwa/student/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Quranova", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0b3f33",
  width: "device-width",
  initialScale: 1,
};

export default function StudentRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f6faf7] text-slate-800">{children}</div>;
}
