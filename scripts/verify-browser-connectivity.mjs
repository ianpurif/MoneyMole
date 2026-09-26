import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
let browser, stage = 'isolated browser launch';
try {
  browser = await chromium.launch({headless:true});
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', () => pageErrors.push('page_error'));
  stage = 'local production app and hydration';
  const response = await page.goto('http://127.0.0.1:3000', {timeout:30000});
  assert.equal(response.status(), 200);
  await page.getByRole('button', {name:'Check for 1AM'}).waitFor();
  stage = 'browser CSP, prover CORS and read-only Preprod access';
  const checks = await page.evaluate(async () => {
    const timeout = () => AbortSignal.timeout(20000);
    const result = {};
    for (const path of ['check','prove']) {
      const r = await fetch(`http://127.0.0.1:6300/${path}`, {method:'OPTIONS',signal:timeout()});
      result[`${path}BrowserCors`] = r.ok;
    }
    const indexer = await fetch('https://indexer.preprod.midnight.network/api/v4/graphql', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'query($address:HexEncoded!){contractAction(address:$address){transaction{block{height hash}}}}',variables:{address:'47f3f2f299d79608cf8c0048e775391428d903ab2c7ef054f42ac294df366635'}}),signal:timeout()});
    const indexed = await indexer.json();
    result.indexerBrowserFetch = indexer.ok && !indexed.errors && indexed.data.contractAction.transaction.block.height > 0;
    const rpc = await fetch('https://rpc.preprod.midnight.network',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'chain_getFinalizedHead',params:[]}),signal:timeout()});
    const head = await rpc.json();
    result.rpcBrowserFetch = rpc.ok && !head.error && /^0x[a-f0-9]{64}$/.test(head.result);
    return result;
  });
  assert(Object.values(checks).every(v => v === true)); assert.equal(pageErrors.length,0);
  const report = {scope:'production_browser_csp_cors_and_read_only_preprod_connectivity',result:'passed',observedAt:new Date().toISOString(),origin:'http://127.0.0.1:3000',checks,limitations:['Fresh isolated Chromium; no real wallet extension','Prover OPTIONS access only; actual proof generation recorded separately','No signing or live transaction']};
  writeFileSync('reports/browser-connectivity.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
} catch {
  writeFileSync('reports/browser-connectivity.json',JSON.stringify({result:'failed',stage,observedAt:new Date().toISOString()},null,2)+'\n');
  console.error(`Production browser connectivity failed at ${stage}; no private inputs were used.`); process.exitCode=1;
} finally { await browser?.close(); }
