import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Teacher Portal", template: "%s | Quranova Teacher Portal" },
  robots: { index: false, follow: false },
};

export default function TeacherRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f4f6f3] text-ink">{children}</div>;
}
