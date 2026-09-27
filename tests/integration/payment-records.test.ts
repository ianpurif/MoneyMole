import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { openPayments } from "../../src/lib/midnight/payments";
import { paymentAsset, openStore, readRecord, type WalletContext } from "../../src/lib/midnight/payment-session";
import { encodeClaim, type ClaimPayload } from "../../src/lib/midnight/payment-codec";

// Production controller + real AES-GCM/IndexedDB records. Only protocol/network,
// proving and wallet boundaries are synthetic; this suite never proves settlement.
const h = vi.hoisted(() => ({
  spent: false, balance: 0n, nextId: "10".repeat(32), down: false,
  observations: new Map<string, unknown>(), beforeSubmit: undefined as undefined | (() => Promise<void>),
  loseResponse: false, guard: vi.fn(async () => {}), submit: vi.fn(), balanceTx: vi.fn(), transfer: vi.fn(),
}));
vi.mock("../../src/lib/midnight/payment-network", () => {
  return { PaymentKeys: class {},
    verifiedPaymentState: vi.fn(async () => { if (h.down) throw new Error("synthetic network unavailable"); return { state: { data: {} }, zswap: {}, parameters: {} }; }),
    observeTransaction: vi.fn(async (id: string) => { if (h.down) throw new Error("synthetic network unavailable"); return h.observations.get(id) ?? null; }),
    outputObservations: vi.fn(() => []),
  };
});
vi.mock("../../src/lib/midnight/payment-contract", () => ({
  paymentContract: () => ({}), ledger: () => ({ notes: { findPathForLeaf: () => ({}), isFull: () => false }, spent: { member: () => h.spent } }),
}));
vi.mock("../../src/lib/midnight/feasibility/qualify-escrow", () => ({ qualifyEscrowCoin: (_: unknown, coin: object) => ({ ...coin, mt_index: 0n }) }));
vi.mock("@midnight-ntwrk/compact-runtime", async importOriginal => ({
  ...await importOriginal<object>(), ContractState: { deserialize: () => ({ data: {} }) },
}));
vi.mock("@midnight-ntwrk/midnight-js-contracts", () => ({ createUnprovenCallTxFromInitialStates: async (_: unknown, args: { initialPrivateState: { payload: ClaimPayload } }) => ({
  private: { unprovenTx: { prove: async () => ({ serialize: () => new Uint8Array([0xaa, 0xbb]) }) },
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
const wallet = { walletId: "synthetic-independent-wallet", coinKey: "06".repeat(32), encKey: "07".repeat(32), address: "synthetic-wallet-address", guard: h.guard,
  api: { getShieldedBalances: async () => ({ [paymentAsset()]: h.balance }), getDustBalance: async () => ({ balance: 1n }), balanceUnsealedTransaction: h.balanceTx, submitTransaction: h.submit, makeTransfer: h.transfer },
} as unknown as WalletContext;
function observation(id: string, status = "SUCCESS") {
  return { hash: id, raw: "ccdd", identifiers: [id], block: { hash: "03".repeat(32), height: 100 }, transactionResult: { status },
    contractActions: [{ address: contract, state: "aa" }], zswapLedgerEvents: [{ raw: `01${id}` }, { raw: `02${id}` }] };
}
async function open() { const c = await openPayments(wallet, contract, password); controllers.push(c); return c; }
async function claim() {
  const c = await open();
  const payload: ClaimPayload = { version: 1, network: "preprod", contract, asset: paymentAsset(), amount: "10", nonce: "08".repeat(32), authority: "09".repeat(32), fundingId };
  const token = await encodeClaim(payload), view = await c.receive(token);
  await c.prepare(view.id);
  return { c, id: view.id, token };
}
async function saved(id: string) {
  const store = await openStore(wallet, contract, password);
  try { return (await readRecord<{ tx: { phase: string; transactionId?: string }; payload: ClaimPayload; failedAttempts?: { transactionId: string; action: string }[]; spend?: { transactionId?: string } }>(store, id))!.value; }
  finally { store.lock(); }
}
beforeEach(() => {
  vi.clearAllMocks(); vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("document", Object.assign(new EventTarget(), { visibilityState: "visible" }));
  vi.stubGlobal("navigator", { locks: { request: async (_: string, __: unknown, action: () => Promise<unknown>) => action() } });
  h.spent = false; h.balance = 0n; h.nextId = "10".repeat(32); h.down = false; h.loseResponse = false; h.beforeSubmit = undefined;
  h.observations.clear(); h.observations.set(fundingId, observation(fundingId));
  h.guard.mockResolvedValue(); h.balanceTx.mockResolvedValue({ tx: "ccdd" }); h.transfer.mockResolvedValue({ tx: "ccdd" });
  h.submit.mockImplementation(async () => { await h.beforeSubmit?.(); if (h.loseResponse) throw new Error("synthetic acknowledgment lost"); });
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
  const { ShieldedAddress, ShieldedCoinPublicKey, ShieldedEncryptionPublicKey } = await import("@midnight-ntwrk/wallet-sdk-address-format");
  const destination = ShieldedAddress.codec.encode("preprod", new ShieldedAddress(ShieldedCoinPublicKey.fromHexString("30".repeat(32)), ShieldedEncryptionPublicKey.fromHexString("31".repeat(32)))).asString();
  expect(destination.length).toBe(132);
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
