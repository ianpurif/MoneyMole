import { run, blocked } from "./lib.mjs";
const result = run("git", ["log", "--format=%h %s", "--max-count=100"], { timeout: 5_000 });
if (!result.ok) blocked("No readable repository history. Owner-controlled commits remain pending.");
else { console.log(result.stdout); console.log("History is read-only. Commit count alone does not establish meaningful development or eligibility."); }
