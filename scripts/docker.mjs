import { existsSync, readFileSync } from "node:fs";
import { at, run } from "./lib.mjs";

/** Prefer native Compose; reuse Docker Desktop's installed CLI inside WSL. */
export function dockerCommand() {
  if (run("docker", ["compose", "version", "--short"], { timeout: 8000 }).ok) return "docker";
  const desktop = "/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe";
  const wsl = process.platform === "linux" && existsSync("/proc/sys/kernel/osrelease") && /microsoft/i.test(readFileSync("/proc/sys/kernel/osrelease", "utf8"));
  if (wsl && existsSync(desktop) && run(desktop, ["compose", "version", "--short"], { timeout: 8000 }).ok) return desktop;
  return "docker";
}
export function composeFile(command) {
  if (!command.endsWith("docker.exe") || process.platform !== "linux") return at("compose.yaml");
  const translated = run("wslpath", ["-w", at("compose.yaml")]);
  if (!translated.ok || !translated.stdout.trim()) throw new Error("Cannot resolve Compose file for Docker Desktop");
  return translated.stdout.trim();
}
