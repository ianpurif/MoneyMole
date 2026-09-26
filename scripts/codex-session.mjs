import { spawn } from "node:child_process";
import { ROOT } from "./lib.mjs";
/** Read-only JSONL session; never starts a model turn, writes config or calls an MCP tool. */
export async function withCodexSession(callback) {
  const child = spawn("codex", ["app-server"], { cwd: ROOT, stdio: ["pipe", "pipe", "pipe"], shell: false });
  let nextId = 1, buffer = "", bytes = 0, ended = false;
  const pending = new Map();
  const rejectAll = () => { ended = true; for (const p of pending.values()) p.reject(new Error("Client session ended or timed out")); pending.clear(); };
  const timer = setTimeout(() => { rejectAll(); child.kill("SIGTERM"); }, 25_000);
  const allowed = new Set(["initialize", "config/read", "model/list", "mcpServerStatus/list"]);
  const request = (method, params) => new Promise((resolve, reject) => {
    if (!allowed.has(method) || ended) return reject(new Error("Unsupported read-only method or closed session"));
    const id = nextId++; pending.set(id, { resolve, reject });
    child.stdin.write(JSON.stringify({ id, method, params }) + "\n");
  });
  child.once("error", rejectAll); child.once("exit", rejectAll); child.stdin.on("error", rejectAll);
  child.stderr.on("data", () => {});
  child.stdout.on("data", chunk => {
    bytes += chunk.length; if (bytes > 1_000_000) { rejectAll(); child.kill(); return; }
    buffer += chunk.toString(); let index;
    while ((index = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, index); buffer = buffer.slice(index + 1);
      try { const message = JSON.parse(line); const item = pending.get(message.id); if (item && !message.method) { pending.delete(message.id); if (message.error) item.reject(new Error("Client rejected read-only request")); else item.resolve(message.result); } } catch { /* Malformed stdout is not success. */ }
    }
  });
  try {
    await request("initialize", { clientInfo: { name: "private_payments_doctor", title: "Private Payments doctor", version: "0.1.0" } });
    child.stdin.write(JSON.stringify({ method: "initialized" }) + "\n");
    return await callback(request);
  } finally {
    clearTimeout(timer); rejectAll(); child.kill("SIGTERM");
    const killTimer = setTimeout(() => { if (child.exitCode === null) child.kill("SIGKILL"); }, 1_000); killTimer.unref();
  }
}
export async function listPages(request, method, extra = {}) {
  const data = []; let cursor;
  for (let page = 0; page < 10; page++) {
    const value = await request(method, { limit: 100, ...extra, ...(cursor ? { cursor } : {}) });
    if (!Array.isArray(value?.data)) throw new Error("Unexpected installed protocol shape");
    data.push(...value.data); cursor = value.nextCursor;
    if (!cursor) return data;
  }
  throw new Error("Pagination bound exceeded");
}
