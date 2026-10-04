import { applicationRecords, profileRepository } from "@/container";
import { resumeFileName } from "@/domain/slug";
import { getCurrentUser } from "@/infrastructure/auth/session";

// Serves the resume. Stored PDFs expire after 24 hours; after that it's rebuilt
// from the saved Typst source. ?download=pdf|typ downloads instead of previewing.
export async function GET(req: Request, ctx: RouteContext<"/applications/[id]/pdf">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const download = new URL(req.url).searchParams.get("download");
  const ext = download === "typ" ? "typ" : "pdf";

  const file = await applicationRecords().pdfFor(user.id, Number(id));
  if (!file) return new Response("Not found", { status: 404 });

  const profile = await profileRepository().findByUser(user.id);
  const filename = resumeFileName(file.company, profile?.profile.personal.name ?? user.name, ext);

  return new Response(ext === "typ" ? file.typSource : new Uint8Array(file.pdf), {
    headers: {
      "Content-Type": ext === "typ" ? "text/plain; charset=utf-8" : "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
