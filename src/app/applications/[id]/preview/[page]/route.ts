import { applicationRecords } from "@/container";
import { getCurrentUser } from "@/infrastructure/auth/session";

// One page of the resume as a PNG, for the on-screen viewer. The ETag is the
// resume's content hash, so the browser re-uses pages until the resume changes.
export async function GET(req: Request, ctx: RouteContext<"/applications/[id]/preview/[page]">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id, page } = await ctx.params;
  const preview = await applicationRecords().previewFor(user.id, Number(id));
  const index = Number(page) - 1;
  if (!preview || !Number.isInteger(index) || index < 0 || index >= preview.pages.length) {
    return new Response("Not found", { status: 404 });
  }

  const etag = `"${preview.version}-${index + 1}"`;
  const headers = { ETag: etag, "Cache-Control": "private, no-cache" };
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
  return new Response(new Uint8Array(preview.pages[index]), { headers: { ...headers, "Content-Type": "image/png" } });
}
