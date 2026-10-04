import { readFile } from "node:fs/promises";
import { applicationRepository } from "@/container";

export async function GET(_req: Request, ctx: RouteContext<"/applications/[id]/pdf">) {
  const { id } = await ctx.params;
  const app = await applicationRepository().findById(Number(id));
  if (!app?.pdfPath) return new Response("Not found", { status: 404 });

  const pdf = await readFile(app.pdfPath);
  const filename = app.pdfPath.split("/").pop();
  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
