import { ImageResponse } from "next/og";

const SIZES = new Set(["192", "512"]);

// App icon drawn at request time, so no image files need to be maintained.
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  const px = Number(size);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b3f33" }}>
        <svg width={px * 0.62} height={px * 0.62} viewBox="0 0 48 48">
          <path d="M24 5l5.6 10.6L41 21.6l-11.4 5.7L24 43l-5.6-15.7L7 21.6l11.4-6z" fill="#c9a24b" />
          <path d="M24 14l3.2 6.2 6.3 3.3-6.3 3.3L24 33l-3.2-6.2-6.3-3.3 6.3-3.3z" fill="#0f6b49" />
        </svg>
      </div>
    ),
    { width: px, height: px },
  );
}
