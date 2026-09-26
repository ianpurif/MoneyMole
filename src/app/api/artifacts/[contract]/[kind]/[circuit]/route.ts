import { publicArtifact } from "@/lib/server/artifacts";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ contract: string; kind: string; circuit: string }> }) {
  const { contract, kind, circuit } = await params;
  try {
    const artifact = await publicArtifact(contract, kind, circuit);
    if (!artifact) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(artifact.bytes), { headers: { "Content-Type": "application/octet-stream", "Cache-Control": "no-store", "X-Artifact-SHA256": artifact.digest } });
  } catch { return new Response("Compiled artifact unavailable", { status: 503 }); }
}
