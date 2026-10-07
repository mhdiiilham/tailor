import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { hnRepository } from "@/container";
import { parseHnPostId } from "@/domain/hn";
import { ogCard } from "../ogCard";

export const alt = "A job post from Hacker News, on Tailor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

const PLUM = "#762D46";

// The share image of one job: role, company, the facts the post gives and its stack, so a
// pasted link shows what the job is. Falls back to a plain card if the post is gone.
export default async function JobImage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseHnPostId((await params).id);
  const post = id === null ? null : await hnRepository().findPost(id);
  const card = post ? ogCard(post) : null;

  const lockup = await readFile(join(process.cwd(), "public/brand/tailor-horizontal-white.svg"));
  const logo = `data:image/svg+xml;base64,${lockup.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 80px",
        background: PLUM,
        color: "#FFFFFF",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <img src={logo} width={220} height={66} alt="" style={{ marginLeft: -6 }} />
        <div style={{ display: "flex", fontSize: 26, opacity: 0.8 }}>Hacker News · Who is hiring?</div>
      </div>

      {card ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: card.title.length > 70 ? 54 : 72,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -1,
            }}
          >
            {card.title}
          </div>
          {card.company ? (
            <div style={{ display: "flex", marginTop: 20, fontSize: 44, opacity: 0.9 }}>{card.company}</div>
          ) : null}
          {card.facts.length ? (
            <div style={{ display: "flex", marginTop: 28, fontSize: 30, opacity: 0.85 }}>
              {card.facts.join("  ·  ")}
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ display: "flex", fontSize: 60, fontWeight: 700 }}>Job post not found</div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, minHeight: 48 }}>
        {card?.stack.map((tech) => (
          <div
            key={tech}
            style={{
              display: "flex",
              padding: "8px 18px",
              fontSize: 26,
              borderRadius: 8,
              background: "rgba(255, 255, 255, 0.16)",
            }}
          >
            {tech}
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
