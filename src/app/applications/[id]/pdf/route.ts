import { applicationRepository, profileRepository } from "@/container";
import { resumeFileName } from "@/domain/slug";
import { getCurrentUser } from "@/infrastructure/auth/session";

// Serves the resume from the database. ?download=pdf|typ downloads instead of previewing.
export async function GET(req: Request, ctx: RouteContext<"/applications/[id]/pdf">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const app = await applicationRepository().findById(user.id, Number(id));
  if (!app?.pdf || !app.typSource) return new Response("Not found", { status: 404 });

  const download = new URL(req.url).searchParams.get("download");
  const ext = download === "typ" ? "typ" : "pdf";
  const profile = await profileRepository().findByUser(user.id);
  const filename = resumeFileName(app.company, profile?.profile.personal.name ?? user.name, ext);

  return new Response(ext === "typ" ? app.typSource : new Uint8Array(app.pdf), {
    headers: {
      "Content-Type": ext === "typ" ? "text/plain; charset=utf-8" : "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
