import type { Network } from "../../domain/payment";
export interface PrivateNamespace { readonly network: Network; readonly contractAddress: string; readonly walletIdentity: string; readonly schemaVersion: number; }
/** Unlock binds one namespace. Imports remain unverified until chain reconciliation. */
export interface UnlockedPrivateStore {
  read(key: string): Promise<{ revision: number; plaintext: Uint8Array } | null>;
  write(key: string, plaintext: Uint8Array, expectedRevision: number): Promise<number>;
  exportEncrypted(key: string): Promise<string>;
  importEncrypted(key: string, ciphertext: string, password: string): Promise<number>;
  lock(): void;
}
