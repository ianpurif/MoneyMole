import preprod from "../config/preprod.json" with { type: "json" };
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
let browser, checks, stage = 'isolated browser launch';
try {
  browser = await chromium.launch({headless:true});
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', () => pageErrors.push('page_error'));
  stage = 'local production app and hydration';
  const response = await page.goto('http://localhost:3000', {timeout:30000});
  assert.equal(response.status(), 200);
  await page.getByRole('button', {name:'Connect Wallet',exact:true}).waitFor();
  stage = 'browser CSP, prover CORS and read-only Preprod access';
  checks = await page.evaluate(async (config) => {
    const timeout = () => AbortSignal.timeout(20000);
    const result = {};
    for (const path of ['check','prove']) {
      // Match the provider's POST and content type so Chromium exercises the
      // real preflight. Empty synthetic input must be rejected, never proved.
      const r = await fetch(`${config.proofServer}/${path}`, {method:'POST',headers:{'Content-Type':'application/octet-stream'},body:new Uint8Array(),signal:timeout()});
      result[`${path}BrowserCors`] = r.status === 400;
    }
    const indexer = await fetch(config.indexerHttp, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'query($address:HexEncoded!){contractAction(address:$address){transaction{block{height hash}}}}',variables:{address:config.issuerAddress}}),signal:timeout()});
    const indexed = await indexer.json();
    result.indexerBrowserFetch = indexer.ok && !indexed.errors && indexed.data.contractAction.transaction.block.height > 0;
    const rpc = await fetch(config.nodeRpc,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'chain_getFinalizedHead',params:[]}),signal:timeout()});
    const head = await rpc.json();
    result.rpcBrowserFetch = rpc.ok && !head.error && /^0x[a-f0-9]{64}$/.test(head.result);
    return result;
  }, preprod);
  assert(Object.values(checks).every(v => v === true)); assert.equal(pageErrors.length,0);
  const report = {scope:'production_browser_csp_cors_and_read_only_preprod_connectivity',result:'passed',observedAt:new Date().toISOString(),origin:'http://localhost:3000',checks,limitations:['Fresh isolated Chromium; no real wallet extension','Prover malformed POST rejection only; actual proof generation recorded separately','No signing or live transaction']};
  writeFileSync('reports/browser-connectivity.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
} catch {
  writeFileSync('reports/browser-connectivity.json',JSON.stringify({result:'failed',stage,checks,observedAt:new Date().toISOString()},null,2)+'\n');
  console.error(`Production browser connectivity failed at ${stage}; no private inputs were used.`); process.exitCode=1;
} finally { await browser?.close(); }
