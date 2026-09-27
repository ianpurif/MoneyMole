import "client-only";
import type { OneAmSession } from "../midnight/oneam";
import { BrowserPrivateStore } from "./indexed-db";
import { requirePassphrase } from "./passphrase";
import { decodeClaim } from "../midnight/payment-codec";
import { createPasskey, unlockPasskey, readAuth, saveAuth, wrapPassphrase, unwrapPassphrase, packageRecovery, unpackRecovery } from "./local-auth";

/** One in-memory owner per connected wallet. No secrets in React state or web storage. */
export class RecoverySession {
  #secret = "";
  #release: (() => void) | undefined;
  #epoch = 0;
  #listeners = new Set<() => void>();
  #revision = 0;
  #working = false;
  payments: Awaited<ReturnType<OneAmSession["openPayments"]>> | null = null;
  deployment: Awaited<ReturnType<OneAmSession["preparePaymentDeployment"]>> | null = null;
  issuer: Awaited<ReturnType<OneAmSession["prepareIssuer"]>> | null = null;
  escrow = "";
  pendingClaim = "";
  message = "";
  existing = false;
  constructor(readonly wallet: OneAmSession, readonly walletId: string) {}
  subscribe = (listener: () => void) => { this.#listeners.add(listener); return () => { this.#listeners.delete(listener); }; };
  snapshot = () => this.#revision;
  changed() { this.#revision++; for (const listener of this.#listeners) listener(); }
  get authenticated() { return !!this.#secret; }
  get busy() { return this.#working; }
  get hasPasskey() { try { return !!readAuth(this.walletId)?.passkey; } catch { return false; } }
  get hasFallback() { try { return !!readAuth(this.walletId)?.passphrase; } catch { return false; } }
  async initialize() {
    try { this.existing = !!readAuth(this.walletId) || (await BrowserPrivateStore.namespaces(this.walletId)).length > 0; }
    catch { this.existing = true; this.message = "Local authentication data is unavailable or damaged. Preserve this browser’s data and your recovery backup."; }
    const saved = localStorage.getItem(`moneymole/escrow/v3/${this.walletId}`) ?? localStorage.getItem("moneymole/night-escrow/v2");
    if (saved && /^[a-f0-9]{64}$/.test(saved)) this.escrow = saved;
    this.changed();
  }
  lock = () => {
    this.#epoch++; this.#secret = ""; this.#release?.(); this.#release = undefined;
    this.payments?.lock(); this.deployment?.lock(); this.issuer?.lock();
    this.payments = null; this.deployment = null; this.issuer = null; this.pendingClaim = "";
    this.#working = false; this.message = "MoneyMole is locked."; this.changed();
  };
  #assert(epoch: number) { if (epoch !== this.#epoch) throw new Error("MoneyMole was locked. Unlock to continue."); }
  async #run(action: (epoch: number) => Promise<void>) {
    if (this.#working) return;
    const epoch = this.#epoch; this.#working = true; this.message = ""; this.changed();
    try { await action(epoch); }
    catch (error) {
      if (epoch === this.#epoch) this.message = error instanceof DOMException && error.name === "NotAllowedError"
        ? "Passkey request cancelled or unavailable. Try again or use your recovery passphrase."
        : error instanceof Error && /^(Use at least|Passkey|This passkey|Passkeys|Unlock|MoneyMole|Add a recovery|Some saved|Choose|Local authentication)/.test(error.message)
          ? error.message : "Could not unlock these records. Check your MoneyMole recovery passphrase. Existing data is unchanged.";
    } finally { if (epoch === this.#epoch) { this.#working = false; this.changed(); } }
  }
  async #validate(secret: string) {
    for (const namespace of await BrowserPrivateStore.namespaces(this.walletId)) {
      const store = await BrowserPrivateStore.unlock(namespace, secret);
      store.lock();
    }
  }
  async #accept(secret: string, epoch: number) {
    this.#assert(epoch);
    this.#secret = secret; this.#release ??= BrowserPrivateStore.manageWallet(this.walletId);
    this.existing = true;
    // Recovery never creates a deployment or submits a transaction.
    const namespaces = await BrowserPrivateStore.namespaces(this.walletId); this.#assert(epoch);
    if (namespaces.some(ns => ns.contractAddress === "night-payment-deployment-staging-v2")) {
      try {
        const opened = await this.wallet.preparePaymentDeployment(secret);
        if (epoch !== this.#epoch) { opened.lock(); return; }
        this.deployment = opened;
        if (!this.pendingClaim && !localStorage.getItem(`moneymole/escrow/v3/${this.walletId}`)) this.escrow = opened.review().address;
      } catch { this.#assert(epoch); this.message = "MoneyMole unlocked. Escrow recovery is temporarily unavailable; retry in Tools."; }
    }
    if (this.deployment && this.deployment.review().address === this.escrow && this.deployment.review().phase !== "finalized") {
      this.message = "MoneyMole unlocked. Check your pending escrow in Tools before using it.";
    } else if (this.escrow) {
      try { await this.#openPayments(this.escrow, epoch); }
      catch { this.#assert(epoch); this.message = "MoneyMole unlocked. The selected escrow is not available yet. Check its address or recover your escrow in Tools."; }
    } else this.message = "MoneyMole unlocked. Select an existing escrow or create one in Tools.";
    this.changed();
  }
  async unlockWithPassphrase(password: string) {
    return this.#run(async epoch => {
      requirePassphrase(password);
      const record = readAuth(this.walletId);
      if (record && !record.passphrase) throw new Error("Unlock with your passkey first, then add a recovery passphrase in Security.");
      const secret = record?.passphrase ? await unwrapPassphrase(this.walletId, record.passphrase, password) : password;
      await this.#validate(secret); this.#assert(epoch);
      if (!record) {
        const passphrase = await wrapPassphrase(this.walletId, secret, password); this.#assert(epoch);
        saveAuth(this.walletId, { version: 1, passphrase });
      }
      await this.#accept(secret, epoch);
    });
  }
  async continueWithPasskey() {
    return this.#run(async epoch => {
      const record = readAuth(this.walletId);
      if (record?.passkey && !this.authenticated) {
        this.message = "Use your passkey to unlock MoneyMole."; this.changed();
        const secret = await unlockPasskey(this.walletId, record.passkey);
        await this.#validate(secret); await this.#accept(secret, epoch); return;
      }
      if (!this.authenticated && (record || (await BrowserPrivateStore.namespaces(this.walletId)).length))
        throw new Error("Unlock with your existing recovery passphrase once, then add a passkey in Security.");
      this.message = "Create a passkey for MoneyMole in your browser’s secure prompt."; this.changed();
      const secret = this.#secret || Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
      const passkey = await createPasskey(this.walletId, secret); this.#assert(epoch);
      saveAuth(this.walletId, { ...record, version: 1, passkey });
      if (!this.authenticated) await this.#accept(secret, epoch);
      this.message = "Passkey ready. Add a recovery passphrase in Security for portable backups.";
    });
  }
  async addFallback(password: string) {
    return this.#run(async epoch => {
      if (!this.#secret) throw new Error("Unlock MoneyMole first.");
      const passphrase = await wrapPassphrase(this.walletId, this.#secret, password); this.#assert(epoch);
      saveAuth(this.walletId, { ...readAuth(this.walletId), version: 1, passphrase }); this.message = "Recovery passphrase saved. Keep it somewhere safe.";
    });
  }
  async #openPayments(address: string, epoch: number) {
    if (!this.#secret) throw new Error("Unlock MoneyMole first.");
    if (!/^[a-f0-9]{64}$/.test(address)) throw new Error("Choose a valid escrow address.");
    if (this.payments?.contract === address) return;
    const opened = await this.wallet.openPayments(address, this.#secret);
    if (epoch !== this.#epoch) { opened.lock(); throw new Error("MoneyMole was locked. Unlock to continue."); }
    this.payments?.lock(); this.payments = opened; this.escrow = address;
    localStorage.setItem(`moneymole/escrow/v3/${this.walletId}`, address);
  }
  async selectEscrow(address: string) {
    return this.#run(async epoch => {
      if (!this.authenticated) { this.escrow = address; return; }
      try { await this.#openPayments(address, epoch); this.message = "Escrow ready across MoneyMole."; }
      catch { throw new Error("Choose a compatible, finalized NIGHT escrow. If it has older local records, use the original recovery passphrase. Your current escrow is unchanged."); }
    });
  }
  async captureClaim(token: string) {
    const epoch = this.#epoch, payload = await decodeClaim(token); this.#assert(epoch);
    this.pendingClaim = token;
    if (!this.authenticated) this.escrow = payload.contract;
    else await this.selectEscrow(payload.contract);
    this.changed();
  }
  async receiveClaim(token: string) {
    const epoch = this.#epoch, payload = await decodeClaim(token); this.#assert(epoch);
    await this.#openPayments(payload.contract, epoch); this.#assert(epoch);
    const result = await this.payments!.receive(token); this.#assert(epoch);
    this.pendingClaim = ""; this.changed(); return result;
  }
  async prepareDeployment() {
    if (!this.#secret) throw new Error("Unlock MoneyMole first.");
    if (this.deployment) { await this.activateDeployment(); return this.deployment; }
    const epoch = this.#epoch, opened = await this.wallet.preparePaymentDeployment(this.#secret);
    if (epoch !== this.#epoch) { opened.lock(); throw new Error("MoneyMole was locked."); }
    this.deployment = opened; await this.activateDeployment(); this.changed(); return opened;
  }
  async activateDeployment() {
    if (this.deployment?.review().phase === "finalized") await this.selectEscrow(this.deployment.review().address);
  }
  async prepareIssuer() {
    if (!this.#secret) throw new Error("Unlock MoneyMole first.");
    if (this.issuer) return this.issuer;
    const epoch = this.#epoch, opened = await this.wallet.prepareIssuer(this.#secret);
    if (epoch !== this.#epoch) { opened.lock(); throw new Error("MoneyMole was locked."); }
    this.issuer = opened; this.changed(); return opened;
  }
  backup(text: string) { return packageRecovery(this.walletId, text); }
  async importPayment(text: string, password: string) {
    const controller = this.payments; if (!controller) throw new Error("Unlock your escrow first.");
    const source = await unpackRecovery(this.walletId, text, password);
    return controller.importEncrypted(source.text, source.password);
  }
  async restoreAdmin(kind: "issuer" | "escrow", text: string, password: string) {
    if (!this.#secret) throw new Error("Unlock MoneyMole first.");
    const epoch = this.#epoch, source = await unpackRecovery(this.walletId, text, password);
    this.#assert(epoch);
    await this.wallet.restoreAdmin(kind, this.#secret, source.text, source.password); this.#assert(epoch);
    if (kind === "escrow") {
      const opened = await this.prepareDeployment();
      await this.selectEscrow(opened.review().address);
    } else await this.prepareIssuer();
    this.changed();
  }
}
