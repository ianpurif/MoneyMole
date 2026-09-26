import { paymentBuildMetadata } from "@/lib/server/build-metadata";
export const runtime = "nodejs";
export async function GET() {
  try { return Response.json(await paymentBuildMetadata(), { headers: { "Cache-Control": "no-store" } }); }
  catch { return new Response("Compiled build unavailable", { status: 503 }); }
}
