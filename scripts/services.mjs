import net from "node:net";
import { run, printResult, blocked } from "./lib.mjs";
import { dockerCommand, composeFile } from "./docker.mjs";
import { proofServerPort } from "./local-config.mjs";
let port;
try { port = proofServerPort(); } catch (error) { blocked(error.message); }
if (!port) { /* Invalid local configuration already reported without its value. */ }
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
    const command = dockerCommand(), file = composeFile(command);
    const env = { ...process.env, PROOF_SERVER_PORT: String(port) };
    const config = run(command, ["compose", "--file", file, "config", "--quiet"], { timeout: 10_000, env });
    if (!config.ok) blocked("Docker Compose configuration or engine is unavailable.");
    else { const result = run(command, ["compose", "--file", file, ...args], { timeout: 180_000, env }); printResult("local proof service action", result); if (!result.ok) process.exitCode = 1; }
  }
}
