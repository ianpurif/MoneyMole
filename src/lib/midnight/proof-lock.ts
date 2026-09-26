import "client-only";
/** Serializes proof requests within this browser origin. Other profiles must be coordinated by the owner. */
export async function withLocalProver<T>(action: () => Promise<T>): Promise<T> {
  if (!navigator.locks) throw new Error("Web Locks are required for local proving");
  return navigator.locks.request("moneymole-local-prover", { mode: "exclusive" }, action);
}
