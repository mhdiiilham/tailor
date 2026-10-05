import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION } from "./seo/site";

export const alt = "Tailor: tailored resumes for every job description";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The real lockup (the wordmark is outlined paths), so the logo isn't redrawn in another font.
export default async function OpengraphImage() {
  const lockup = await readFile(join(process.cwd(), "public/brand/tailor-horizontal-white.svg"));
  const src = `data:image/svg+xml;base64,${lockup.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 96px",
        background: "#762D46",
        color: "#FFFFFF",
      }}
    >
      <img src={src} width={600} height={180} alt="" style={{ marginLeft: -12 }} />
      <p style={{ marginTop: 40, fontSize: 44, lineHeight: 1.25, maxWidth: 960 }}>
        Tailored resumes for every job description.
      </p>
      <p style={{ marginTop: 8, fontSize: 28, lineHeight: 1.4, maxWidth: 960, opacity: 0.8 }}>{SITE_DESCRIPTION}</p>
    </div>,
    size,
  );
}
