// Public on purpose: the browser fetches the manifest before anyone signs in.
export function GET() {
  const manifest = {
    name: "Quranova Student Portal",
    short_name: "Quranova",
    description: "Classes, lessons and progress for your family.",
    start_url: "/student",
    scope: "/student",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6faf7",
    theme_color: "#0b3f33",
    icons: [
      { src: "/pwa/student/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/student/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/student/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" },
  });
}
