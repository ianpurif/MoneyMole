import "client-only";
import { PrivateCipher, namespaceId, parseEnvelope, type EncryptedEnvelope } from "./crypto";
import type { PrivateNamespace, UnlockedPrivateStore } from "./port";

type Stored = { revision: number; envelope: EncryptedEnvelope };
const CHECK = "unlock_check";
const marker = new TextEncoder().encode("moneymole/private-store/v1");

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("moneymole-private-v1", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("records");
    request.onerror = () => reject(new Error("Private storage unavailable"));
    request.onblocked = () => reject(new Error("Close older tabs before upgrading private storage"));
    request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
  });
}
function read(db: IDBDatabase, key: string): Promise<Stored | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("records", "readonly");
    const request = tx.objectStore("records").get(key);
    tx.oncomplete = () => resolve(request.result === undefined ? null : request.result as Stored);
    tx.onerror = () => reject(new Error("Private storage read failed"));
    tx.onabort = () => reject(new Error("Private storage read aborted"));
  });
}
function validStored(value: Stored): Stored {
  if (!value || !Number.isSafeInteger(value.revision) || value.revision < 1 || value.revision === Number.MAX_SAFE_INTEGER) throw new Error("Corrupted private revision");
  return { revision: value.revision, envelope: parseEnvelope(value.envelope) };
}
function compareAndSwap(db: IDBDatabase, key: string, previous: number, envelope: EncryptedEnvelope): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("records", "readwrite", { durability: "strict" });
    const store = tx.objectStore("records");
    const request = store.get(key);
    request.onsuccess = () => {
      try {
        const revision = request.result === undefined ? 0 : validStored(request.result as Stored).revision;
        if (revision !== previous) { tx.abort(); return; }
        store.put({ revision: previous + 1, envelope }, key);
      } catch { tx.abort(); }
    };
    tx.oncomplete = () => resolve(previous + 1);
    tx.onabort = () => reject(new Error("Private write conflict or corruption; reload and reconcile"));
    tx.onerror = () => reject(new Error("Private storage write failed"));
  });
}

/** Local-only store. Restored bytes are unverified; no import may certify chain settlement. */
export class BrowserPrivateStore implements UnlockedPrivateStore {
  #db: IDBDatabase;
  #cipher: PrivateCipher;
  #namespace: PrivateNamespace;
  #closed = false;
  #timer: ReturnType<typeof setTimeout>;
  #hide = () => { if (document.visibilityState === "hidden") this.lock(); };
  private constructor(db: IDBDatabase, cipher: PrivateCipher, namespace: PrivateNamespace) {
    this.#db = db; this.#cipher = cipher; this.#namespace = Object.freeze({ ...namespace });
    this.#timer = setTimeout(() => this.lock(), 5 * 60_000);
    document.addEventListener("visibilitychange", this.#hide);
  }
  static async unlock(namespace: PrivateNamespace, password: string, create = false): Promise<BrowserPrivateStore> {
    const prefix = namespaceId(namespace);
    const db = await openDatabase();
    let cipher: PrivateCipher | undefined;
    try {
      const existing = await read(db, `${prefix}/${CHECK}`);
      if (!existing && !create) throw new Error("Private namespace does not exist; explicitly create it");
      if (existing && create) throw new Error("Private namespace exists; unlock it without replacement");
      cipher = await PrivateCipher.unlock(password, existing ? validStored(existing).envelope.salt : undefined);
      if (existing) {
        const bytes = await cipher.decrypt(namespace, CHECK, existing.envelope);
        const valid = bytes.length === marker.length && bytes.every((b, i) => b === marker[i]);
        bytes.fill(0);
        if (!valid) throw new Error("Invalid private store marker");
      } else await compareAndSwap(db, `${prefix}/${CHECK}`, 0, await cipher.encrypt(namespace, CHECK, marker));
      return new BrowserPrivateStore(db, cipher, namespace);
    } catch (error) { cipher?.lock(); db.close(); throw error; }
  }
  static async exists(namespace: PrivateNamespace): Promise<boolean> {
    const db = await openDatabase();
    try { return await read(db, `${namespaceId(namespace)}/${CHECK}`) !== null; }
    finally { db.close(); }
  }
  #key(record: string): string {
    if (this.#closed) throw new Error("Private store is locked");
    if (record === CHECK || !/^[A-Za-z0-9_-]{1,128}$/.test(record)) throw new Error("Invalid private record key");
    return `${namespaceId(this.#namespace)}/${record}`;
  }
  async read(record: string): Promise<{ revision: number; plaintext: Uint8Array } | null> {
    const stored = await read(this.#db, this.#key(record));
    if (!stored) return null;
    const { revision, envelope } = validStored(stored);
    return { revision, plaintext: await this.#cipher.decrypt(this.#namespace, record, envelope) };
  }
  async write(record: string, plaintext: Uint8Array, expectedRevision: number): Promise<number> {
    const key = this.#key(record);
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || expectedRevision >= Number.MAX_SAFE_INTEGER - 1) throw new Error("Invalid expected revision");
    // Authenticate the existing bytes before allowing replacement, even at the correct revision.
    const existing = await this.read(record);
    existing?.plaintext.fill(0);
    if ((existing?.revision ?? 0) !== expectedRevision) throw new Error("Private write conflict; reconcile first");
    const envelope = await this.#cipher.encrypt(this.#namespace, record, plaintext);
    this.#key(record);
    return compareAndSwap(this.#db, key, expectedRevision, envelope);
  }
  async exportEncrypted(record: string): Promise<string> {
    const stored = await read(this.#db, this.#key(record));
    if (!stored) throw new Error("Private record not found");
    const e = validStored(stored).envelope;
    const bytes = await this.#cipher.decrypt(this.#namespace, record, e);
    bytes.fill(0);
    return JSON.stringify(e);
  }
  async keys(): Promise<string[]> {
    this.#key("list");
    const prefix = `${namespaceId(this.#namespace)}/`;
    return new Promise((resolve, reject) => {
      const tx = this.#db.transaction("records", "readonly"), request = tx.objectStore("records").getAllKeys();
      tx.oncomplete = () => resolve(request.result.filter((k): k is string => typeof k === "string" && k.startsWith(prefix) && k !== `${prefix}${CHECK}`).map(k => k.slice(prefix.length)));
      tx.onerror = () => reject(new Error("Private record listing failed"));
      tx.onabort = () => reject(new Error("Private record listing aborted"));
    });
  }
  async importEncrypted(record: string, text: string, password: string): Promise<number> {
    await this.importManyEncrypted({ [record]: text }, password);
    return 1;
  }
  async importManyEncrypted(records: Record<string, string>, password: string): Promise<void> {
    const entries = Object.entries(records);
    if (!entries.length || entries.length > 16) throw new Error("Invalid recovery bundle size");
    const prepared: { key: string; envelope: EncryptedEnvelope }[] = [];
    // Authenticate and re-encrypt every entry before mutating IndexedDB.
    for (const [record, text] of entries) {
      const key = this.#key(record);
      if (text.length > 1_500_000) throw new Error("Encrypted import too large");
      const envelope = parseEnvelope(JSON.parse(text));
      const source = await PrivateCipher.unlock(password, envelope.salt);
      let bytes: Uint8Array | undefined;
      try {
        bytes = await source.decrypt(this.#namespace, record, envelope);
        prepared.push({ key, envelope: await this.#cipher.encrypt(this.#namespace, record, bytes) });
      } finally { bytes?.fill(0); source.lock(); }
    }
    this.#key(entries[0]![0]);
    await new Promise<void>((resolve, reject) => {
      const tx = this.#db.transaction("records", "readwrite", { durability: "strict" });
      const target = tx.objectStore("records");
      // add() fails on an existing key, aborting the entire bundle atomically.
      for (const entry of prepared) target.add({ revision: 1, envelope: entry.envelope }, entry.key);
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(new Error("Recovery import aborted; existing records preserved"));
      tx.onerror = () => reject(new Error("Recovery import failed; existing records preserved"));
    });
  }
  lock(): void {
    if (this.#closed) return;
    this.#closed = true; clearTimeout(this.#timer);
    document.removeEventListener("visibilitychange", this.#hide);
    this.#cipher.lock(); this.#db.close();
  }
}
