import net from "node:net";
import { readFileSync } from "node:fs";
import { at, has, run, printResult, blocked } from "./lib.mjs";
let port = process.env.PROOF_SERVER_PORT;
if (!port && has(".env")) port = /^PROOF_SERVER_PORT=(\d+)$/m.exec(readFileSync(at(".env"), "utf8"))?.[1];
port = Number(port ?? "6300");
if (!Number.isInteger(port) || port < 1024 || port > 65535) { blocked("PROOF_SERVER_PORT must be an integer from 1024 through 65535."); }
else if (process.argv[2] === "check") {
  const connected = await new Promise(resolve => {
    const socket = net.connect({ host: "127.0.0.1", port });
    socket.setTimeout(3_000);
    const finish = value => { socket.destroy(); resolve(value); };
    socket.once("connect", () => finish(true)); socket.once("timeout", () => finish(false)); socket.once("error", () => finish(false));
  });
  console.log(connected ? `TCP listener reachable on 127.0.0.1:${port}; identity, CORS and proving are NOT verified.` : `No reachable TCP listener on 127.0.0.1:${port}.`);
  // Reachability alone is deliberately insufficient for a prover readiness success.
  blocked("Run the M1 real proving gate before declaring the proof service ready.");
} else {
  const args = { up: ["up", "-d", "proof-server"], down: ["stop", "proof-server"], status: ["ps", "proof-server"] }[process.argv[2]];
  if (!args) blocked("Use up, down, status or check.");
  else {
    const config = run("docker", ["compose", "--file", "compose.yaml", "config", "--quiet"], { timeout: 10_000 });
    if (!config.ok) blocked("Docker Compose configuration or engine is unavailable.");
    else { const result = run("docker", ["compose", "--file", "compose.yaml", ...args], { timeout: 180_000 }); printResult("local proof service action", result); if (!result.ok) process.exitCode = 1; }
  }
}
