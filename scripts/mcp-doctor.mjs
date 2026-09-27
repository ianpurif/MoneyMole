import { run, saveJson, blocked, ROOT } from "./lib.mjs";
import { withCodexSession, listPages } from "./codex-session.mjs";
const endpoint = "https://midnight.mcp.kapa.ai";
const report = { scope: "installed_client_observed_documentation_mcp_tool_listing", observedAt: new Date().toISOString(), endpoint, result: "blocked", toolInvocations: 0 };
if (!run("codex", ["--version"], { timeout: 5_000 }).ok) { report.reason = "Codex executable unavailable; no MCP connection can be observed"; blocked(report.reason); }
else {
  try {
    await withCodexSession(async request => {
      const config = (await request("config/read", { includeLayers: false, cwd: ROOT })).config;
      if (config?.mcp_servers?.midnight?.url !== endpoint) throw new Error("Effective endpoint mismatch");
      const servers = await listPages(request, "mcpServerStatus/list", { detail: "toolsAndAuthOnly" });
      const server = servers.find(s => s.name === "midnight");
      const tools = server?.tools;
      const count = Array.isArray(tools) ? tools.length : tools && typeof tools === "object" ? Object.keys(tools).length : 0;
      if (!count) {
        // Classify the failure without publishing URLs, tokens or auth metadata.
        report.reason = /auth required|unauthorized|\b401\b/i.test(server?.toolsError ?? "")
          ? "Remote documentation MCP requires authentication; application runtime is unaffected"
          : "No initialized Midnight documentation tools observed";
        throw new Error("No initialized Midnight tools observed");
      }
      report.observedToolCount = count; report.result = "passed";
      // Do not dump tool schemas, authentication metadata or other configured servers.
    });
  } catch { report.reason ??= "Configured Midnight tool listing could not be observed; inspect trusted-client connection and installed protocol"; blocked(report.reason); }
}
saveJson("reports/mcp-doctor.json", report); console.log(JSON.stringify(report, null, 2));
