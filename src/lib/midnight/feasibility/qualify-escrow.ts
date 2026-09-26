import "client-only";
import { ZswapInput, ZswapOutput, type ShieldedCoinInfo, type QualifiedShieldedCoinInfo, type ZswapChainState } from "@midnight-ntwrk/midnight-js-protocol/ledger";

export interface EscrowOutputObservation {
  readonly contract: string;
  readonly commitment: string;
  readonly mtIndex: bigint;
}

/** Local candidate only. The caller must independently authenticate network/finality/state.
 * No coin opening is sent to an indexer, server or other service by this function.
 */
export function qualifyEscrowCoin(contract: string, opening: ShieldedCoinInfo, observations: readonly EscrowOutputObservation[], state: ZswapChainState): QualifiedShieldedCoinInfo {
  try {
    if (!/^[a-f0-9]{64}$/.test(contract) || !/^[a-f0-9]{64}$/.test(opening.nonce) ||
        !/^[a-f0-9]{64}$/.test(opening.type) || opening.value <= 0n || opening.value > (1n << 128n) - 1n || observations.length > 4096) throw new Error();
    const commitment = ZswapOutput.newContractOwned(opening, undefined, contract).commitment;
    const matches = observations.filter(o => o.contract === contract && o.commitment === commitment);
    const match = matches[0];
    if (matches.length !== 1 || !match) throw new Error();
    const mt_index = match.mtIndex;
    if (typeof mt_index !== "bigint" || mt_index < 0n || mt_index > (1n << 64n) - 1n) throw new Error();
    const coin = { ...opening, mt_index };
    // Native construction checks that the opening/index belongs to the supplied tree.
    // It does not establish that this tree is canonical or that the coin is unspent.
    ZswapInput.newContractOwned(coin, undefined, contract, state);
    return coin;
  } catch { throw new Error("Escrow coin could not be qualified against the supplied public state"); }
}
