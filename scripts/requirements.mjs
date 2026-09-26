import { readFileSync, writeFileSync } from "node:fs";
import { at, readJson, isMain, hashFile, has } from "./lib.mjs";
export const STATES = ["not_started", "implemented", "verified", "blocked", "owner_pending"];
export function validateRequirements(data, verifyFiles = false) {
  if (data.schemaVersion !== 1 || !Array.isArray(data.requirements)) throw new Error("Invalid requirements document");
  const ids = new Set();
  for (const r of data.requirements) {
    if (!/^[A-Z0-9]+-[A-Z0-9-]+$/.test(r.id) || ids.has(r.id)) throw new Error("Invalid or duplicate requirement ID");
    ids.add(r.id);
    if (!STATES.includes(r.status) || !r.acceptance || !Array.isArray(r.dependsOn) || !Array.isArray(r.evidence)) throw new Error(`Incomplete requirement ${r.id}`);
    if (r.status === "verified") {
      if (!r.evidence.length) throw new Error(`Verified requirement lacks evidence: ${r.id}`);
      for (const e of r.evidence) {
        if (e.result !== "passed" || !e.scope || !e.command || !e.path || !/^[a-f0-9]{64}$/.test(e.sha256 ?? "") || !Number.isFinite(Date.parse(e.observedAt)) || !e.subjects?.length) throw new Error(`Incomplete verification evidence: ${r.id}`);
        if (verifyFiles) {
          if (!has(e.path) || hashFile(e.path) !== e.sha256) throw new Error(`Missing or stale evidence: ${r.id}`);
          for (const s of e.subjects) if (!has(s.path) || hashFile(s.path) !== s.sha256) throw new Error(`Changed evidence subject: ${r.id}`);
        }
      }
    }
  }
  const byId = new Map(data.requirements.map(r => [r.id, r]));
  const active = new Set(), done = new Set();
  const walk = id => {
    if (active.has(id)) throw new Error("Cyclic requirement dependencies");
    if (done.has(id)) return;
    active.add(id);
    for (const dep of byId.get(id).dependsOn) { if (!ids.has(dep)) throw new Error("Unknown requirement dependency"); walk(dep); }
    active.delete(id); done.add(id);
  };
  for (const id of ids) walk(id);
  for (const r of data.requirements) {
    if (r.status === "verified" && r.dependsOn.some(id => byId.get(id).status !== "verified")) throw new Error(`Unverified prerequisite for ${r.id}`);
  }
  return data;
}
function cell(value) { return String(value).replaceAll("|", "\\|").replaceAll("\n", " "); }
export function renderRequirements(data) {
  validateRequirements(data);
  let text = "# Requirements report\n\nGenerated from `docs/requirements.json`. Edit the JSON, then run `npm run requirements:report`.\n\nEngineering readiness and challenge qualification are separate. No score is inferred from file counts.\n\n";
  for (const section of [...new Set(data.requirements.map(r => r.level))]) {
    text += `## ${section}\n\n| ID | Requirement | State | Dependencies | Acceptance |\n|---|---|---|---|---|\n`;
    for (const r of data.requirements.filter(r => r.level === section)) text += `| ${r.id} | ${cell(r.title)} | ${r.status} | ${r.dependsOn.join(", ") || "None"} | ${cell(r.acceptance)} |\n`;
    text += "\n";
  }
  text += "## Source conflicts and external decisions\n\n";
  for (const c of data.conflicts) text += `- **${c.id}:** ${c.decision} Status: ${c.status}.\n`;
  text += "\n## Evidence policy\n\nA verified item needs a dated command result, sanitized evidence-file digest, scope and source-file digests. Changed subjects invalidate verification. Participant counts, public metadata, meaningful commits and eligibility require separate owner-supplied evidence.\n";
  return text;
}
if (isMain(import.meta.url)) {
  try {
    const data = validateRequirements(readJson("docs/requirements.json"), true), report = renderRequirements(data);
    if (process.argv.includes("--write")) { writeFileSync(at("docs/REQUIREMENTS.md"), report); console.log("Derived report written."); }
    else { if (readFileSync(at("docs/REQUIREMENTS.md"), "utf8") !== report) throw new Error("Derived requirements report is stale"); console.log("Requirements schema, dependencies, evidence references and report are consistent. This is not requirement fulfillment."); }
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
