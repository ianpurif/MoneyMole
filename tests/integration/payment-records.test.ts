import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { openPayments } from "../../src/lib/midnight/payments";
import { paymentAsset, openStore, readRecord, submitOnce, type WalletContext } from "../../src/lib/midnight/payment-session";
import { encodeClaim, type ClaimPayload } from "../../src/lib/midnight/payment-codec";
import { PaymentFlow } from "../../src/lib/midnight/payment-flow";
import { observeTransaction } from "../../src/lib/midnight/payment-network";
import { PaymentError } from "../../src/lib/midnight/payment-errors";

// Production controller + real AES-GCM/IndexedDB records. Only protocol/network,
// proving and wallet boundaries are synthetic; this suite never proves settlement.
const h = vi.hoisted(() => ({
  spent: false, balance: 0n, nextId: "10".repeat(32), down: false,
  observations: new Map<string, unknown>(), beforeSubmit: undefined as undefined | (() => Promise<void>),
  loseResponse: false, guard: vi.fn(async () => {}), submit: vi.fn(), balanceTx: vi.fn(), transfer: vi.fn(),
  proofFails: false, proofs: 0, notePresent: true, failGuardAfterProof: false,
}));
vi.mock("../../src/lib/midnight/payment-network", () => {
  return { PaymentKeys: class {},
    verifiedPaymentState: vi.fn(async () => { if (h.down) throw new Error("synthetic network unavailable"); return { state: { data: {} }, zswap: {}, parameters: {} }; }),
    observeTransaction: vi.fn(async (id: string) => { if (h.down) throw new Error("synthetic network unavailable"); return h.observations.get(id) ?? null; }),
    outputObservations: vi.fn(() => []),
  };
});
vi.mock("../../src/lib/midnight/payment-contract", () => ({
  paymentContract: () => ({}), ledger: () => ({ notes: { findPathForLeaf: () => h.notePresent ? {} : undefined, isFull: () => false }, spent: { member: () => h.spent } }),
}));
vi.mock("../../src/lib/midnight/night-settlement", () => ({ verifyNightCall: vi.fn(), verifyNightSpend: vi.fn() }));
vi.mock("@midnight-ntwrk/compact-runtime", async importOriginal => ({
  ...await importOriginal<object>(), ContractState: { deserialize: () => ({ data: {} }) },
}));
vi.mock("@midnight-ntwrk/midnight-js-contracts", () => ({ createUnprovenCallTxFromInitialStates: async (_: unknown, args: { initialPrivateState: { payload: ClaimPayload } }) => ({
  private: { unprovenTx: { prove: async () => { h.proofs++; if (h.failGuardAfterProof) h.guard.mockRejectedValue(new Error("synthetic throttled wallet")); if (h.proofFails) throw new Error("synthetic proof unavailable"); return { serialize: () => new Uint8Array([0xaa, 0xbb]) }; } },
    newCoins: [{ type: args.initialPrivateState.payload.asset, value: BigInt(args.initialPrivateState.payload.amount) }] },
}) }));
vi.mock("@midnight-ntwrk/midnight-js-protocol/ledger", async importOriginal => ({
  ...await importOriginal<object>(),
  Transaction: { deserialize: () => ({ intents: new Map(), identifiers: () => [h.nextId] }) },
  ZswapInput: { newContractOwned: () => ({ nullifier: "22".repeat(32) }) },
  ZswapOutput: { new: () => ({ commitment: "11".repeat(32) }) },
  Event: { deserialize: (bytes: Uint8Array) => ({ source: { transactionHash: Array.from(bytes.slice(1), b => b.toString(16).padStart(2, "0")).join("") },
    content: bytes[0] === 1 ? { tag: "zswapOutput", commitment: "11".repeat(32) } : { tag: "zswapInput", nullifier: "22".repeat(32) } }) },
}));

const contract = "05".repeat(32), fundingId = "01".repeat(32), password = "synthetic local recovery passphrase";
type Controller = Awaited<ReturnType<typeof openPayments>>;
const controllers: Controller[] = [];
const wallet = { walletId: "synthetic-independent-wallet", coinKey: "06".repeat(32), encKey: "07".repeat(32), address: "synthetic-wallet-address", unshieldedKey: "06".repeat(32), guard: h.guard,
  api: { getUnshieldedBalances: async () => ({ [paymentAsset()]: h.balance }), getDustBalance: async () => ({ balance: 1n }), balanceUnsealedTransaction: h.balanceTx, submitTransaction: h.submit, makeTransfer: h.transfer },
} as unknown as WalletContext;
function observation(id: string, status = "SUCCESS") {
  return { hash: id, raw: "ccdd", identifiers: [id], block: { hash: "03".repeat(32), height: 100 }, transactionResult: { status },
    contractActions: [{ address: contract, state: "aa" }], zswapLedgerEvents: [{ raw: `01${id}` }, { raw: `02${id}` }] };
}
async function open() { const c = await openPayments(wallet, contract, password); controllers.push(c); return c; }
async function claim() {
  const c = await open();
  const payload: ClaimPayload = { version: 2, network: "preprod", contract, asset: paymentAsset(), amount: "10", nonce: "08".repeat(32), authority: "09".repeat(32), fundingId };
  const token = await encodeClaim(payload), view = await c.receive(token);
  await c.prepare(view.id);
  return { c, id: view.id, token };
}
async function saved(id: string) {
  const store = await openStore(wallet, contract, password, 2);
  try { return (await readRecord<{ tx: { phase: string; transactionId?: string }; payload: ClaimPayload; failedAttempts?: { transactionId: string; action: string }[]; spend?: { transactionId?: string } }>(store, id))!.value; }
  finally { store.lock(); }
}
beforeEach(() => {
  vi.clearAllMocks(); vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("document", Object.assign(new EventTarget(), { visibilityState: "visible" }));
  vi.stubGlobal("navigator", { locks: { request: async (_: string, __: unknown, action: () => Promise<unknown>) => action() } });
  h.spent = false; h.balance = 0n; h.nextId = "10".repeat(32); h.down = false; h.loseResponse = false; h.beforeSubmit = undefined;
  h.proofFails = false; h.failGuardAfterProof = false; h.proofs = 0; h.notePresent = true;
  h.observations.clear(); h.observations.set(fundingId, observation(fundingId));
  h.guard.mockResolvedValue(); h.balanceTx.mockResolvedValue({ tx: "ccdd" }); h.transfer.mockResolvedValue({ tx: "ccdd" });
  h.submit.mockImplementation(async () => { await h.beforeSubmit?.(); if (h.loseResponse) throw new Error("synthetic acknowledgment lost"); });
});

it("saves and inspects a sender draft without wallet or network refreshes", async () => {
  const c = await open(); h.down = true; h.guard.mockRejectedValue(new Error("synthetic wallet offline"));
  const draft = await c.create("1");
  expect((await c.reconcile(draft.id)).phase).toBe("draft");
  expect(h.guard).not.toHaveBeenCalled(); expect(h.balanceTx).not.toHaveBeenCalled();
});

it("wizard preserves one encrypted draft through balance and proof retries, then resumes the prepared proof", async () => {
  const c = await open(), flow = new PaymentFlow(c);
  await flow.start({amount:"1"});
  const id = flow.payment!.id;
  expect(flow.stage).toBe("balance"); expect(flow.error).toContain("more NIGHT"); expect(await c.list()).toHaveLength(1);
  await flow.start({amount:"2"}); expect(flow.payment!.id).toBe(id); expect(flow.payment!.amount).toBe("1000000"); expect(await c.list()).toHaveLength(1);
  h.balance = 1_000_000n; h.proofFails = true; await flow.retry();
  expect(flow.stage).toBe("prepare"); expect(flow.error).toContain("local proof service");
  expect(flow.payment!.id).toBe(id); expect(await c.list()).toHaveLength(1);
  h.proofFails = false; await flow.retry(); expect(flow.stage).toBe("authorization"); expect(h.proofs).toBe(2);
  flow.dispose(); c.lock();
  const recovered = await open(), reopened = new PaymentFlow(recovered); await reopened.resume(id);
  expect(reopened.stage).toBe("authorization"); expect(h.proofs).toBe(2); expect(h.balanceTx).not.toHaveBeenCalled(); reopened.dispose();
});

it("saves a finished proof before a follow-up wallet read fails and resumes without reproving", async () => {
  h.balance = 2_000_000n; h.failGuardAfterProof = true;
  const c = await open(), flow = new PaymentFlow(c);
  await flow.start({amount:"1"}); const id = flow.payment!.id;
  expect(flow.stage).toBe("prepare"); expect((await saved(id)).tx.phase).toBe("prepared");
  expect(h.proofs).toBe(1); h.failGuardAfterProof = false; h.guard.mockResolvedValue(undefined);
  await flow.retry(); expect(flow.stage).toBe("authorization"); expect(h.proofs).toBe(1);
  expect(h.balanceTx).not.toHaveBeenCalled(); flow.dispose();
});

it("wizard recovers a lost submission response through confirmation without another approval or submission", async () => {
  h.balance = 2_000_000n; h.nextId = "10".repeat(33); const c = await open(), flow = new PaymentFlow(c);
  await flow.start({amount:"1"}); const id = flow.payment!.id;
  h.loseResponse = true; const approval = Promise.all([flow.authorize(), flow.authorize()]);
  await vi.waitFor(() => expect(flow.stage).toBe("confirmation"));
  expect(flow.payment!.transactionId).toBe(h.nextId);
  expect((await saved(id)).tx.phase).toBe("outcome_unknown");
  flow.dispose(); await approval; c.lock(); h.loseResponse = false; h.observations.set(h.nextId, observation(h.nextId));
  vi.stubGlobal("location", {origin:"http://localhost:3000"});
  const recovered = new PaymentFlow(await open()); await recovered.resume(id);
  expect(recovered.stage).toBe("success"); expect(recovered.link).toContain("/claim#mm3.");
  expect(h.balanceTx).toHaveBeenCalledTimes(1); expect(h.submit).toHaveBeenCalledTimes(1); recovered.dispose();
});

it("keeps checking automatically after a temporary indexer failure", async () => {
  h.balance = 2_000_000n; h.nextId = "11".repeat(33);
  const c = await open(), flow = new PaymentFlow(c);
  await flow.start({ amount: "1" });
  h.observations.set(h.nextId, observation(h.nextId));
  vi.mocked(observeTransaction).mockRejectedValueOnce(new PaymentError("network"));
  vi.stubGlobal("location", { origin: "http://localhost:3000" });
  await flow.authorize();
  expect(flow.stage).toBe("success");
  expect(flow.link).toContain("/claim#mm3.");
  expect(h.submit).toHaveBeenCalledTimes(1);
  flow.dispose();
}, 10_000);

it("archives only a confirmed complete failed funding attempt before allowing a fresh proof", async () => {
  h.balance = 2_000_000n; const c = await open(), draft = await c.create("1"); await c.prepare(draft.id); await c.approve(draft.id);
  h.observations.set(h.nextId, observation(h.nextId, "PARTIAL_SUCCESS"));
  await expect(c.retryFailed(draft.id,"fund")).rejects.toThrow();
  h.notePresent = false; h.observations.set(h.nextId, observation(h.nextId,"FAILURE"));
  expect((await c.reconcile(draft.id)).fundingRetryAvailable).toBe(true);
  const reset = await c.retryFailed(draft.id,"fund"); expect(reset.phase).toBe("draft"); expect(reset.failedAttempts).toBe(1);
  expect((await saved(draft.id)).payload.fundingId).toBe("00".repeat(32));
});

it("bounds a stalled submission acknowledgement without retrying the wallet call", async () => {
  vi.useFakeTimers();
  try {
    h.submit.mockImplementationOnce(() => new Promise(() => {}));
    const result = expect(submitOnce(wallet.api, "synthetic-transaction")).rejects.toThrow("Waiting for final confirmation");
    await vi.advanceTimersByTimeAsync(30_001); await result;
    expect(h.submit).toHaveBeenCalledTimes(1);
  } finally { vi.useRealTimers(); }
});

it("wizard resumes an interrupted received-NIGHT transfer instead of declaring the earlier claim done", async () => {
  const { c, id } = await claim(); await c.approve(id);
  h.spent = true; h.balance = 10n; h.observations.set(h.nextId, observation(h.nextId));
  const flow = new PaymentFlow(c); await flow.resume(id); expect(flow.stage).toBe("success");
  const { UnshieldedAddress } = await import("@midnight-ntwrk/wallet-sdk-address-format");
  const destination = UnshieldedAddress.codec.encode("preprod", new UnshieldedAddress(Buffer.alloc(32, 48))).asString();
  h.nextId = "17".repeat(32); h.loseResponse = true; const spending = flow.spend(destination);
  await vi.waitFor(() => expect(flow.stage).toBe("confirmation"));
  expect(flow.stage).toBe("confirmation"); expect(flow.payment?.spendTransactionId).toBe(h.nextId);
  expect(flow.payment?.spendVerified).toBe(false); flow.dispose(); await spending; c.lock();
  h.loseResponse = false; h.observations.set(h.nextId, observation(h.nextId)); h.balance = 0n;
  const recovered = new PaymentFlow(await open()); await recovered.resume(id);
  expect(recovered.stage).toBe("success"); expect(recovered.payment?.spendVerified).toBe(true);
  expect(h.transfer).toHaveBeenCalledTimes(1); expect(h.submit).toHaveBeenCalledTimes(2); recovered.dispose();
});
afterEach(() => { for (const c of controllers.splice(0)) c.lock(); vi.unstubAllGlobals(); });

it("recovers an interrupted real payment record with identifier durable before submission", async () => {
  const { c, id } = await claim();
  h.beforeSubmit = async () => { const r = await saved(id); expect(r.tx.phase).toBe("outcome_unknown"); expect(r.tx.transactionId).toBe(h.nextId); };
  h.loseResponse = true; await expect(c.approve(id)).rejects.toThrow(); c.lock();
  const recovered = await open();
  expect((await recovered.list())[0]?.claimRetryAvailable).toBe(false);
  await expect(recovered.approve(id)).rejects.toThrow(); await expect(recovered.prepare(id)).rejects.toThrow();
  await expect(recovered.retryFailed(id, "claim")).rejects.toThrow(); expect(h.submit).toHaveBeenCalledTimes(1);
});

it("archives a finalized failed claim across reload, then proves and authorizes a fresh attempt", async () => {
  const { c, id, token } = await claim(); await c.approve(id);
  const firstId = h.nextId; h.observations.set(firstId, observation(firstId, "FAILURE"));
  expect((await c.reconcile(id)).claimRetryAvailable).toBe(true); c.lock();
  const recovered = await open();
  expect((await recovered.list())[0]?.claimRetryAvailable).toBe(false);
  expect((await recovered.receive(token)).id).toBe(id);
  const reset = await recovered.retryFailed(id, "claim"); expect(reset.phase).toBe("draft"); expect(reset.transactionId).toBeUndefined();
  const record = await saved(id); expect(record.failedAttempts).toHaveLength(1); expect(record.failedAttempts![0]?.transactionId).toBe(firstId); expect(record.payload.fundingId).toBe(fundingId);
  h.nextId = "12".repeat(32); await recovered.prepare(id); await recovered.approve(id);
  h.spent = true; h.balance = 10n; h.observations.set(h.nextId, observation(h.nextId));
  const settled = await recovered.reconcile(id); expect(settled.claimed && settled.walletSynced).toBe(true); expect(settled.failedAttempts).toBe(1);
  expect(h.balanceTx).toHaveBeenCalledTimes(2); expect(h.submit).toHaveBeenCalledTimes(2);
});

it.each(["PARTIAL_SUCCESS", "FUTURE_STATUS", "SUCCESS"])("never retries a %s transaction", async status => {
  const { c, id } = await claim(); await c.approve(id);
  h.observations.set(h.nextId, observation(h.nextId, status));
  if (status === "SUCCESS") { h.spent = true; h.balance = 10n; }
  await expect(c.retryFailed(id, "claim")).rejects.toThrow();
  expect((await saved(id)).failedAttempts).toBeUndefined(); expect(h.submit).toHaveBeenCalledTimes(1);
});

it("rechecks failure and unspent state instead of trusting old retry flags", async () => {
  const { c, id } = await claim(); await c.approve(id); h.observations.set(h.nextId, observation(h.nextId, "FAILURE"));
  expect((await c.reconcile(id)).claimRetryAvailable).toBe(true);
  h.down = true; await expect(c.retryFailed(id, "claim")).rejects.toThrow();
  expect((await c.list())[0]?.claimRetryAvailable).toBe(false);
  h.down = false; h.spent = true; await expect(c.retryFailed(id, "claim")).rejects.toThrow();
  expect((await saved(id)).tx.transactionId).toBe(h.nextId);
});

it("imports encrypted failed-claim history without trusting it as retry authorization", async () => {
  const { c, id } = await claim(); await c.approve(id); h.observations.set(h.nextId, observation(h.nextId, "FAILURE"));
  await c.retryFailed(id, "claim"); await c.prepare(id); h.nextId = "12".repeat(32); await c.approve(id);
  const encrypted = await c.exportEncrypted(id); c.lock(); vi.stubGlobal("indexedDB", new IDBFactory());
  const recovered = await open(), imported = await recovered.importEncrypted(encrypted, password);
  expect(imported.failedAttempts).toBe(1); expect(imported.claimRetryAvailable).toBe(false);
  await expect(recovered.retryFailed(id, "claim")).rejects.toThrow();
  h.observations.set(h.nextId, observation(h.nextId, "FAILURE")); await recovered.retryFailed(id, "claim");
  expect((await saved(id)).failedAttempts).toHaveLength(2);
});

it("only one competing controller can reset the same failed attempt", async () => {
  const { c, id } = await claim(); await c.approve(id); h.observations.set(h.nextId, observation(h.nextId, "FAILURE"));
  const rival = await open();
  const attempts = await Promise.allSettled([c.retryFailed(id, "claim"), rival.retryFailed(id, "claim")]);
  expect(attempts.filter(r => r.status === "fulfilled")).toHaveLength(1);
  expect((await saved(id)).failedAttempts).toHaveLength(1); expect(h.submit).toHaveBeenCalledTimes(1);
});

it("only one saved-record controller can request authorization for an attempt", async () => {
  const { c, id } = await claim(); const rival = await open();
  const results = await Promise.allSettled([c.approve(id), rival.approve(id)]);
  expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
  expect(h.balanceTx).toHaveBeenCalledTimes(1); expect(h.submit).toHaveBeenCalledTimes(1);
});

it("wallet rejection preserves the prepared record for a fresh explicit approval", async () => {
  const { c, id } = await claim(); h.balanceTx.mockRejectedValueOnce(new Error("synthetic rejection"));
  await expect(c.approve(id)).rejects.toThrow(); expect((await saved(id)).tx.transactionId).toBeUndefined();
  c.lock(); const recovered = await open(); await recovered.approve(id);
  expect(h.balanceTx).toHaveBeenCalledTimes(2); expect(h.submit).toHaveBeenCalledTimes(1);
});

it("preserves a successful claim while resetting only a finalized failed controlled spend", async () => {
  const { c, id } = await claim(); await c.approve(id);
  const claimId = h.nextId; h.spent = true; h.balance = 10n; h.observations.set(claimId, observation(claimId));
  // Use a real well-formed Preprod address for the production recipient validator.
  const { UnshieldedAddress } = await import("@midnight-ntwrk/wallet-sdk-address-format");
  const destination = UnshieldedAddress.codec.encode("preprod", new UnshieldedAddress(Buffer.alloc(32, 48))).asString();
  h.nextId = "13".repeat(32); await c.spend(id, destination); const spendId = h.nextId;
  await expect(c.retryFailed(id, "spend")).rejects.toThrow();
  h.observations.set(spendId, observation(spendId, "FAILURE")); c.lock();
  const recovered = await open(); expect((await recovered.reconcile(id)).spendRetryAvailable).toBe(true);
  await recovered.retryFailed(id, "spend"); const record = await saved(id);
  expect(record.tx.transactionId).toBe(claimId); expect(record.spend).toBeUndefined(); expect(record.failedAttempts![0]?.action).toBe("spend");
  h.nextId = "14".repeat(32); await recovered.spend(id, destination); h.observations.set(h.nextId, observation(h.nextId)); h.balance = 0n;
  expect((await recovered.reconcile(id)).spendVerified).toBe(true);
  await expect(recovered.retryFailed(id, "spend")).rejects.toThrow(); expect(h.transfer).toHaveBeenCalledTimes(2);
});

it("a locked store cannot reset an attempt or invoke a wallet side effect", async () => {
  const { c, id } = await claim(); await c.approve(id); h.observations.set(h.nextId, observation(h.nextId, "FAILURE")); c.lock();
  await expect(c.retryFailed(id, "claim")).rejects.toThrow(); expect(h.submit).toHaveBeenCalledTimes(1);
});

it("tracks NIGHT credit and spend against an existing receiver balance across reload", async () => {
  h.balance = 1_000_000n;
  const { c, id } = await claim(); await c.approve(id);
  h.spent = true; h.balance = 1_000_010n; h.observations.set(h.nextId, observation(h.nextId));
  expect((await c.reconcile(id)).walletSynced).toBe(true); c.lock();
  const recovered = await open();
  const { UnshieldedAddress } = await import("@midnight-ntwrk/wallet-sdk-address-format");
  const destination = UnshieldedAddress.codec.encode("preprod", new UnshieldedAddress(Buffer.alloc(32, 48))).asString();
  h.nextId = "15".repeat(32); await recovered.spend(id, destination);
  expect(h.transfer).toHaveBeenCalledWith([{ kind: "unshielded", type: paymentAsset(), value: 10n, recipient: destination }]);
  h.observations.set(h.nextId, observation(h.nextId)); h.balance = 1_000_000n;
  expect((await recovered.reconcile(id)).spendVerified).toBe(true);
});

it("uses six-decimal NIGHT units and isolates legacy encrypted namespaces", async () => {
  const legacy = await openStore(wallet, contract, password);
  await legacy.write("legacy-marker", new TextEncoder().encode("synthetic legacy data"), 0); legacy.lock();
  const c = await open(); expect(await c.list()).toEqual([]);
  const view = await c.create("1.234567"); expect(view.amount).toBe("1234567");
  await expect(c.create("0.0000001")).rejects.toThrow();
  await expect(c.importEncrypted(JSON.stringify({ version: 1, contract, id: view.id }), password)).rejects.toThrow();
  const original = await openStore(wallet, contract, password); expect(await original.keys()).toContain("legacy-marker"); original.lock();
});
