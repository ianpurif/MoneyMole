import type { Network } from "../../domain/payment";
export interface PrivateNamespace { readonly network: Network; readonly contractAddress: string; readonly walletIdentity: string; readonly schemaVersion: number; }
/** An implementation must authenticate the namespace and provide atomic encrypted writes. */
export interface UnlockedPrivateStore {
  read(namespace: PrivateNamespace, key: string): Promise<Uint8Array | null>;
  write(namespace: PrivateNamespace, key: string, plaintext: Uint8Array): Promise<void>;
  lock(): void;
}
// No plaintext store, default password, persisted key, or fallback implementation is provided.
