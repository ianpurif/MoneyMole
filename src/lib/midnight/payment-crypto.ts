import "client-only";
import { CompactTypeBytes, CompactTypeUnsignedInteger, CompactTypeVector, persistentHash, type CompactType } from "@midnight-ntwrk/compact-runtime";
import type { ClaimPayload } from "./payment-codec";
import { unhex } from "./payment-codec";
const b = new CompactTypeBytes(32), n = new CompactTypeUnsignedInteger((1n << 128n) - 1n, 16);
const pad = (s: string) => { const out = new Uint8Array(32); out.set(new TextEncoder().encode(s)); return out; };
type Note = [Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, bigint, Uint8Array];
// Exact flattened struct order from compiler 0.31.1 NotePreimage (runtime 0.16.0).
const noteType: CompactType<Note> = {
  alignment: () => [...b.alignment(), ...b.alignment(), ...b.alignment(), ...b.alignment(), ...b.alignment(), ...n.alignment(), ...b.alignment()],
  toValue: v => [...b.toValue(v[0]), ...b.toValue(v[1]), ...b.toValue(v[2]), ...b.toValue(v[3]), ...b.toValue(v[4]), ...n.toValue(v[5]), ...b.toValue(v[6])],
  fromValue: v => [b.fromValue(v), b.fromValue(v), b.fromValue(v), b.fromValue(v), b.fromValue(v), n.fromValue(v), b.fromValue(v)],
};
export function noteDigest(p: Omit<ClaimPayload, "fundingId">) {
  return persistentHash(noteType, [pad("moneymole/note/v1"), pad("preprod"), unhex(p.contract, 32), unhex(p.nonce, 32), unhex(p.asset, 32), BigInt(p.amount), unhex(p.authority, 32)]);
}
export function spentDigest(p: Omit<ClaimPayload, "fundingId">) {
  return persistentHash(new CompactTypeVector(3, b), [pad("moneymole/spent/v1"), noteDigest(p), unhex(p.authority, 32)]);
}
