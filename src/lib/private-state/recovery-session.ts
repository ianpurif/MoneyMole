import "client-only";
import type { OneAmSession } from "../midnight/oneam";
import { BrowserPrivateStore } from "./indexed-db";
import { requirePassphrase } from "./passphrase";
import { decodeClaim } from "../midnight/payment-codec";
import { createPasskey, unlockPasskey, readAuth, saveAuth, wrapPassphrase, unwrapPassphrase, packageRecovery, unpackRecovery, preserveAndSelectAuth, preservedWorkspaces, type LocalAuthRecord } from "./local-auth";
import { storageIdentity, RecoveryWorkspaceMismatch } from "./storage-identity";

/** One in-memory owner per connected wallet. No secrets in React state or web storage. */
export class RecoverySession {
  #secret = "";
  #activeIdentity: string | undefined;
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
  recoveryNeeded = false;
  constructor(readonly wallet: OneAmSession, readonly walletId: string) {}
  subscribe = (listener: () => void) => { this.#listeners.add(listener); return () => { this.#listeners.delete(listener); }; };
  snapshot = () => this.#revision;
  changed() { this.#revision++; for (const listener of this.#listeners) listener(); }
  get authenticated() { return !!this.#secret; }
  get busy() { return this.#working; }
  get hasPasskey() { try { return !!readAuth(this.walletId)?.passkey; } catch { return false; } }
  get hasFallback() { try { return !!readAuth(this.walletId)?.passphrase; } catch { return false; } }
  get localIdentity() { return this.#activeIdentity ?? storageIdentity(this.walletId, readAuth(this.walletId)?.storageIdentity); }
  get previousWorkspaces() {
    try {
      const seen = new Set([this.localIdentity]);
      return preservedWorkspaces(this.walletId).slice().reverse().filter(item => {
        const identity = storageIdentity(this.walletId, item.auth?.storageIdentity);
        if (seen.has(identity)) return false;
        seen.add(identity); return true;
      });
    } catch { return []; }
  }
  async initialize() {
    this.escrow = "";
    try {
      this.existing = !!readAuth(this.walletId) || (await BrowserPrivateStore.namespaces(this.localIdentity)).length > 0;
      const saved = localStorage.getItem(`moneymole/escrow/v3/${this.localIdentity}`) ?? (this.localIdentity === this.walletId ? localStorage.getItem("moneymole/night-escrow/v2") : null);
      if (saved && /^[a-f0-9]{64}$/.test(saved)) this.escrow = saved;
    } catch { this.existing = true; this.message = "Local authentication data is unavailable or damaged. Preserve this browser’s data and your recovery backup."; }
    this.changed();
  }
  lock = () => {
    this.#epoch++; this.#secret = ""; this.#release?.(); this.#release = undefined;
    this.payments?.lock(); this.deployment?.lock(); this.issuer?.lock();
    this.payments = null; this.deployment = null; this.issuer = null; this.pendingClaim = "";
    this.#activeIdentity = undefined;
    this.#working = false; this.message = "MoneyMole is locked."; this.changed();
  };
  #assert(epoch: number) {
    if (this.#activeIdentity && storageIdentity(this.walletId, readAuth(this.walletId)?.storageIdentity) !== this.#activeIdentity) {
      this.lock(); throw new Error("Local authentication changed in another tab. Unlock the selected workspace again.");
    }
    if (epoch !== this.#epoch) throw new Error("MoneyMole was locked. Unlock to continue.");
  }
  async #run(action: (epoch: number) => Promise<void>) {
    if (this.#working) return;
    const epoch = this.#epoch; this.#working = true; this.message = ""; this.changed();
    try { await action(epoch); }
    catch (error) {
      if (epoch === this.#epoch) this.message = error instanceof DOMException && error.name === "NotAllowedError"
        ? "Passkey request cancelled or unavailable. Try again or use your recovery passphrase."
        : error instanceof Error && /^(Use at least|Passkey|This passkey|Passkeys|Unlock|MoneyMole|Add a recovery|Some saved|Choose|Local authentication|Confirm|No passkey|This backup|Lock MoneyMole)/.test(error.message)
          ? error.message : "Could not unlock these records. Check your MoneyMole recovery passphrase. Existing data is unchanged.";
    } finally { if (epoch === this.#epoch) { this.#working = false; this.changed(); } }
  }
  async #validate(secret: string) {
    for (const namespace of await BrowserPrivateStore.namespaces(this.localIdentity)) {
      const store = await BrowserPrivateStore.unlock(namespace, secret);
      store.lock();
    }
  }
  async #accept(secret: string, epoch: number) {
    this.#assert(epoch);
    this.#activeIdentity = storageIdentity(this.walletId, readAuth(this.walletId)?.storageIdentity);
    this.#secret = secret; this.#release ??= BrowserPrivateStore.manageWallet(this.localIdentity);
    this.recoveryNeeded = false;
    this.existing = true;
    // Recovery never creates a deployment or submits a transaction.
    const namespaces = await BrowserPrivateStore.namespaces(this.localIdentity); this.#assert(epoch);
    if (namespaces.some(ns => ns.contractAddress === "night-payment-deployment-staging-v2")) {
      try {
        const opened = await this.wallet.preparePaymentDeployment(secret, this.localIdentity);
        if (epoch !== this.#epoch) { opened.lock(); return; }
        this.deployment = opened;
        if (!this.pendingClaim && !localStorage.getItem(`moneymole/escrow/v3/${this.localIdentity}`)) this.escrow = opened.review().address;
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
      if (!record) await this.#validate(secret);
      this.#assert(epoch);
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
        await this.#accept(secret, epoch); return;
      }
      if (!this.authenticated && (record || (await BrowserPrivateStore.namespaces(this.localIdentity)).length)) {
        this.recoveryNeeded = true;
        throw new Error("No passkey is linked to this workspace. Choose a recovery option below.");
      }
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
      this.#assert(epoch);
      const passphrase = await wrapPassphrase(this.walletId, this.#secret, password); this.#assert(epoch);
      saveAuth(this.walletId, { ...readAuth(this.walletId), version: 1, passphrase }); this.message = "Recovery passphrase saved. Keep it somewhere safe.";
    });
  }
  async #openPayments(address: string, epoch: number) {
    this.#assert(epoch);
    if (!this.#secret) throw new Error("Unlock MoneyMole first.");
    if (!/^[a-f0-9]{64}$/.test(address)) throw new Error("Choose a valid escrow address.");
    if (this.payments?.contract === address) return;
    const opened = await this.wallet.openPayments(address, this.#secret, this.localIdentity);
    if (epoch !== this.#epoch) { opened.lock(); throw new Error("MoneyMole was locked. Unlock to continue."); }
    this.payments?.lock(); this.payments = opened; this.escrow = address;
    localStorage.setItem(`moneymole/escrow/v3/${this.localIdentity}`, address);
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
    this.#assert(this.#epoch);
    if (!this.#secret) throw new Error("Unlock MoneyMole first.");
    if (this.deployment) { await this.activateDeployment(); return this.deployment; }
    const epoch = this.#epoch, opened = await this.wallet.preparePaymentDeployment(this.#secret, this.localIdentity);
    if (epoch !== this.#epoch) { opened.lock(); throw new Error("MoneyMole was locked."); }
    this.deployment = opened; await this.activateDeployment(); this.changed(); return opened;
  }
  async activateDeployment() {
    if (this.deployment?.review().phase === "finalized") await this.selectEscrow(this.deployment.review().address);
  }
  async prepareIssuer() {
    this.#assert(this.#epoch);
    if (!this.#secret) throw new Error("Unlock MoneyMole first.");
    if (this.issuer) return this.issuer;
    const epoch = this.#epoch, opened = await this.wallet.prepareIssuer(this.#secret, this.localIdentity);
    if (epoch !== this.#epoch) { opened.lock(); throw new Error("MoneyMole was locked."); }
    this.issuer = opened; this.changed(); return opened;
  }
  backup(text: string) { this.#assert(this.#epoch); return packageRecovery(this.walletId, text); }
  async importPayment(text: string, password: string) {
    const controller = this.payments; if (!controller) throw new Error("Unlock your escrow first.");
    const source = await unpackRecovery(this.walletId, text, password);
    if (storageIdentity(this.walletId, source.storageIdentity) !== this.localIdentity) throw new RecoveryWorkspaceMismatch();
    return controller.importEncrypted(source.text, source.password);
  }
  async restoreAdmin(kind: "issuer" | "escrow", text: string, password: string) {
    if (!this.#secret) throw new Error("Unlock MoneyMole first.");
    const epoch = this.#epoch, source = await unpackRecovery(this.walletId, text, password);
    this.#assert(epoch);
    if (storageIdentity(this.walletId, source.storageIdentity) !== this.localIdentity) throw new RecoveryWorkspaceMismatch();
    await this.wallet.restoreAdmin(kind, this.#secret, source.text, source.password, this.localIdentity); this.#assert(epoch);
    if (kind === "escrow") {
      const opened = await this.prepareDeployment();
      await this.selectEscrow(opened.review().address);
    } else await this.prepareIssuer();
    this.changed();
  }
  async startFresh(method: "passkey" | "passphrase", password: string, confirmed: boolean) {
    return this.#run(async epoch => {
      if (!confirmed) throw new Error("Confirm that old records remain locked before starting a new workspace.");
      if (this.authenticated) throw new Error("Lock MoneyMole before choosing a new workspace.");
      const expected = readAuth(this.walletId);
      const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
      const next: LocalAuthRecord = { version: 1, storageIdentity: `${this.walletId}/local/${crypto.randomUUID()}` };
      if (method === "passkey") {
        this.message = "Create a passkey for a new, separate MoneyMole workspace."; this.changed();
        next.passkey = await createPasskey(this.walletId, secret);
      } else next.passphrase = await wrapPassphrase(this.walletId, secret, password);
      this.#assert(epoch);
      preserveAndSelectAuth(this.walletId, expected, next);
      this.escrow = ""; this.pendingClaim = "";
      await this.#accept(secret, epoch);
      this.message = "New workspace ready. Your previous encrypted records are preserved and remain locked. No escrow or transaction was created.";
    });
  }
  async selectPreserved(id: string) {
    return this.#run(async epoch => {
      if (this.authenticated) throw new Error("Lock MoneyMole before switching workspaces.");
      const item = preservedWorkspaces(this.walletId).find(entry => entry.id === id);
      if (!item) return;
      preserveAndSelectAuth(this.walletId, readAuth(this.walletId), item.auth);
      this.pendingClaim = ""; this.recoveryNeeded = false; await this.initialize(); this.#assert(epoch);
      this.message = "Previous workspace selected. Unlock it with its passkey or original recovery passphrase.";
    });
  }
  async unlockFromBackup(text: string, password: string) {
    return this.#run(async epoch => {
      if (this.authenticated) throw new Error("Lock MoneyMole before restoring another workspace.");
      if (text.length > 3_000_000) throw new Error("This backup is too large.");
      const parsed = JSON.parse(text);
      if (parsed.moneymoleRecovery !== 1) throw new Error("This backup uses the older format. Try its original export passphrase to unlock your old workspace; its files remain unchanged.");
      const expected = readAuth(this.walletId), source = await unpackRecovery(this.walletId, text, password);
      this.#assert(epoch);
      const sameWorkspace = storageIdentity(this.walletId, expected?.storageIdentity) === storageIdentity(this.walletId, source.storageIdentity);
      const next: LocalAuthRecord = { version: 1, passphrase: parsed.key,
        ...(sameWorkspace && expected?.passkey ? { passkey: expected.passkey } : {}),
        ...(source.storageIdentity ? { storageIdentity: source.storageIdentity } : {}) };
      preserveAndSelectAuth(this.walletId, expected, next);
      await this.initialize(); await this.#accept(source.password, epoch);
      this.message = "Unlocked from backup. You can now add a passkey or replace your recovery passphrase in Security. Import any missing records in Tools.";
    });
  }
}
