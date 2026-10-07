import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Self-contained server bundle for a VPS or Docker (ignored by Vercel).
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    // Server Actions default to a 1MB body. Admin uploads (learning materials,
    // lesson page images) need more; one request may carry several images.
    serverActions: { bodySizeLimit: "60mb" },
    // The proxy buffers request bodies and silently cuts them at 10MB, which
    // corrupts larger uploads (the form then fails with a 500). Match the limit above.
    proxyClientMaxBodySize: "60mb",
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
