import { readFile } from "node:fs/promises";
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { sampleSigningKey } from "@midnight-ntwrk/compact-runtime";
import { LedgerParameters, ZswapChainState, rawTokenType } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { createUnprovenDeployTxFromVerifierKeys } from "@midnight-ntwrk/midnight-js-contracts";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { ZKConfigProvider, createVerifierKey, createProverKey, createZKIR } from "@midnight-ntwrk/midnight-js-types";
import { Contract } from "../../../managed/private-payments/contract/index.js";
import { ShieldedCoinPublicKey, ShieldedEncryptionPublicKey } from "@midnight-ntwrk/wallet-sdk-address-format";
import preprod from "../../../config/preprod.json" with { type: "json" };
import type { Page } from "@playwright/test";

class FixtureKeys extends ZKConfigProvider<"fund" | "claim"> {
  async getVerifierKey(c: "fund" | "claim") { return createVerifierKey(new Uint8Array(await readFile(`managed/private-payments/keys/${c}.verifier`))); }
  async getProverKey(c: "fund" | "claim") { return createProverKey(new Uint8Array(await readFile(`managed/private-payments/keys/${c}.prover`))); }
  async getZKIR(c: "fund" | "claim") { return createZKIR(new Uint8Array(await readFile(`managed/private-payments/zkir/${c}.bzkir`))); }
}

/** Isolated synthetic chain/connector; real compiled initial state and browser encryption.
 * Never signs, submits, prepares live deployment, or reads owner records. */
export async function installPaymentFixture(page: Page) {
  setNetworkId("preprod");
  const domain = new Uint8Array(32); domain.set(new TextEncoder().encode(preprod.assetDomain));
  const asset = rawTokenType(domain, preprod.issuerAddress);
  const coin = "01".repeat(32), enc = "02".repeat(32);
  const unused = () => { throw new Error("Fixture constructor must not call payment witnesses"); };
  const compiledContract = CompiledContract.make("private-payments", Contract).pipe(
    CompiledContract.withWitnesses({ fundingCoin: unused, escrowCoin: unused, claimAuthority: unused, membership: unused }),
    CompiledContract.withCompiledFileAssets("private-payments"),
  );
  const deployment = await createUnprovenDeployTxFromVerifierKeys(new FixtureKeys(), coin, { compiledContract, initialPrivateState: {}, signingKey: sampleSigningKey(), args: [new Uint8Array(Buffer.from(asset, "hex"))] }, enc);
  const contract = deployment.public.contractAddress;
  const hash = "03".repeat(32);
  const state = Buffer.from(deployment.public.initialContractState.serialize()).toString("hex");
  await page.route(preprod.indexerHttp, route => route.fulfill({json:{data:{contractAction:{
    state, zswapState: Buffer.from(new ZswapChainState().serialize()).toString("hex"),
    transaction:{block:{height:100,hash,ledgerParameters:Buffer.from(LedgerParameters.initialParameters().serialize()).toString("hex")}},
  }}}}));
  await page.route(preprod.nodeRpc, route => {
    const {method} = route.request().postDataJSON();
    return route.fulfill({json:{jsonrpc:"2.0",id:1,result:method === "chain_getHeader" ? {number:"0x64"} : `0x${hash}`}});
  });
  await page.addInitScript(({asset,coinAddress,encAddress}) => {
    Object.assign(window, { syntheticTransactionCalls:0, midnight:{synthetic:{
      name:"1AM",rdns:"com.midnight.1am",apiVersion:"4.0.1",icon:"",
      connect:async()=>({
        getConnectionStatus:async()=>({status:"connected",networkId:"preprod"}),
        getConfiguration:async()=>({networkId:"preprod"}),
        getShieldedAddresses:async()=>({shieldedAddress:"synthetic-browser-only",shieldedCoinPublicKey:coinAddress,shieldedEncryptionPublicKey:encAddress}),
        getShieldedBalances:async()=>({[asset]:100n}),
        getDustBalance:async()=>({balance:1n}),
        balanceUnsealedTransaction:async()=>{ (window as unknown as {syntheticTransactionCalls:number}).syntheticTransactionCalls++; throw new Error("Synthetic fixture never signs"); },
        submitTransaction:async()=>{ throw new Error("Synthetic fixture never submits"); },
      }),
    }}});
  }, {asset,coinAddress:ShieldedCoinPublicKey.codec.encode("preprod",ShieldedCoinPublicKey.fromHexString(coin)).asString(),encAddress:ShieldedEncryptionPublicKey.codec.encode("preprod",ShieldedEncryptionPublicKey.fromHexString(enc)).asString()});
  return {contract};
}
