import { run, saveJson, blocked, readJson, has, hashFile } from "./lib.mjs";
import { withCodexSession, listPages } from "./codex-session.mjs";
const requested = [{ role: "architect", model: "gpt-6-astra", effort: "medium" }, { role: "engineer", model: "gpt-6-sol", effort: "high" }, { role: "verifier", model: "gpt-6-luna", effort: "max" }];
const installed = run("codex", ["--version"], { timeout: 5_000 });
const report = { observedAt: new Date().toISOString(), scope: "read_only_capabilities_plus_scoped_session_evidence", delegationPerformed: false, result: "blocked", requested };
if (!installed.ok) { report.reason = "Codex executable unavailable"; blocked(report.reason); }
else {
  report.clientVersion = installed.stdout.trim().slice(0, 100);
  try {
    await withCodexSession(async request => {
      const config = (await request("config/read", { includeLayers: false })).config;
      const models = await listPages(request, "model/list", { includeHidden: false });
      report.models = requested.map(r => ({ ...r, available: models.some(m => (m.model === r.model || m.id === r.model) && m.supportedReasoningEfforts?.some(e => e.reasoningEffort === r.effort)) }));
      report.effectiveConfiguration = {
        coordinatorMatches: config?.model === "gpt-6-astra" && config?.model_reasoning_effort === "medium",
        workerLimitMatches: config?.agents?.max_concurrent_threads_per_session === 2,
        midnightEndpointMatches: config?.mcp_servers?.midnight?.url === "https://midnight.mcp.kapa.ai",
      };
      let observedDiscovery = false;
      if (has("docs/evidence/codex-session.json")) {
        const e = readJson("docs/evidence/codex-session.json");
        const files = [".codex/config.toml", ...requested.map(r => `.codex/agents/${r.role}.toml`)];
        observedDiscovery = e.kind === "owner_observed_codex_session" && e.installedSchemaValidated === true && e.projectConfigLoaded === true && e.clientVersion === report.clientVersion && Number.isFinite(Date.parse(e.observedAt)) &&
          requested.every(r => e.agents?.some(a => a.role === r.role && a.model === r.model && a.effort === r.effort && a.discovered === true)) &&
          files.every(path => e.subjects?.some(s => s.path === path && s.sha256 === hashFile(path)));
      }
      report.agentDiscovery = observedDiscovery ? "owner_observed_with_current_config_digests" : "unverified";
      report.result = report.models.every(m => m.available) && Object.values(report.effectiveConfiguration).every(Boolean) && observedDiscovery ? "passed" : "blocked";
      if (report.result !== "passed") { report.reason = "Requested capabilities, loaded configuration or current observed custom-agent/schema evidence is missing"; blocked(report.reason); }
    });
  } catch { report.reason = "Read-only app-server inspection failed or protocol differs. Inspect the installed help/schema; never substitute models silently."; blocked(report.reason); }
}
saveJson("reports/codex-doctor.json", report); console.log(JSON.stringify(report, null, 2));
