import { mkdir } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { installPaymentFixture } from "./support/payment-fixture";

test("forgotten phrase starts a separate workspace and preserves recoverable old payments", async ({page}) => {
  test.setTimeout(90_000);
  const {contract} = await installPaymentFixture(page);
  await page.route("http://127.0.0.1:6300/**", route => route.abort());
  await page.goto("/");
  await page.getByRole("button", {name:"Connect Wallet",exact:true}).click();
  await page.getByRole("button", {name:"1AM",exact:true}).click();
  await page.getByRole("button", {name:"Use recovery passphrase instead"}).click();
  await page.getByLabel("Local recovery passphrase", {exact:true}).fill("original7");
  await page.getByRole("button", {name:"Secure MoneyMole",exact:true}).click();
  await page.getByLabel("Escrow address", {exact:true}).fill(contract);
  await page.getByRole("button", {name:"Use escrow",exact:true}).click();
  await expect(page.getByRole("button", {name:"Send NIGHT"})).toBeVisible({timeout:60_000});
  await page.getByRole("button", {name:"Send NIGHT"}).click();
  await expect(page.getByRole("button", {name:"Retry this step",exact:true})).toBeVisible({timeout:60_000});
  await page.getByRole("button", {name:"Close and resume later"}).click();
  await page.getByRole("button", {name:"Lock workspace"}).click();
  await page.getByRole("button", {name:"Login with Passkey"}).click();
  await expect(page.getByText("No passkey is linked to these records.", {exact:false})).toBeVisible();
  await page.getByText("Start a new local workspace", {exact:true}).click();
  await expect(page.getByRole("button", {name:"Create new workspace with passkey"})).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByText("Use a new recovery passphrase instead", {exact:true}).click();
  await page.getByLabel("New recovery passphrase", {exact:true}).fill("newpass7");
  await page.getByRole("button", {name:"Create new workspace",exact:true}).click();
  await page.getByLabel("Escrow address", {exact:true}).fill(contract);
  await page.getByRole("button", {name:"Use escrow",exact:true}).click();
  await expect(page.getByRole("button", {name:"Send NIGHT"})).toBeVisible();
  await expect(page.getByLabel("Select payment")).toHaveCount(0);
  await page.getByRole("button", {name:"Lock workspace"}).click();
  await page.getByText("Switch to a preserved workspace", {exact:true}).click();
  await page.getByRole("button", {name:/Workspace saved/}).first().click();
  await page.getByRole("button", {name:"Use recovery passphrase instead"}).click();
  await page.getByLabel("Local recovery passphrase", {exact:true}).fill("original7");
  await page.getByRole("button", {name:"Unlock MoneyMole",exact:true}).click();
  await expect(page.getByLabel("Select payment")).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as {syntheticTransactionCalls:number}).syntheticTransactionCalls)).toBe(0);
});

test("one local unlock survives claim-to-home navigation and Tools", async ({page}) => {
  const {contract} = await installPaymentFixture(page);
  await page.goto("/claim");
  await page.getByRole("button", {name:"Connect Wallet",exact:true}).click();
  await page.getByRole("dialog", {name:"Connect Wallet"}).getByRole("button", {name:"1AM",exact:true}).click();
  await page.getByRole("button", {name:"Use recovery passphrase instead"}).click();
  await page.getByLabel("Local recovery passphrase", {exact:true}).fill("seven77");
  await page.getByRole("button", {name:"Secure MoneyMole",exact:true}).click();
  await page.getByLabel("Escrow address", {exact:true}).fill(contract);
  await page.getByRole("button", {name:"Use escrow",exact:true}).click();
  await expect(page.getByRole("button", {name:"Receive NIGHT"})).toBeVisible({timeout:60_000});
  await page.getByRole("link", {name:"MoneyMole home"}).click();
  await expect(page.getByRole("button", {name:"Send NIGHT"})).toBeVisible();
  await expect(page.getByRole("button", {name:/(Continue|Login) with Passkey/})).toHaveCount(0);
  await page.getByRole("button", {name:"Open workspace tools"}).click();
  await expect(page.getByRole("heading", {name:"Security",exact:true})).toBeVisible();
  await expect(page.getByLabel("Local recovery passphrase", {exact:true})).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("button", {name:"Activity",exact:true}).click();
  await expect(page.getByRole("button", {name:/(Continue|Login) with Passkey/})).toHaveCount(0);
  await page.getByRole("button", {name:"Lock workspace"}).click();
  await expect(page.getByRole("button", {name:/(Continue|Login) with Passkey/})).toBeVisible();
});

test("focused synthetic payment workspace saves, validates and recovers a real encrypted draft", async ({page}) => {
  test.setTimeout(90_000);
  await mkdir("reports/revision", { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const {contract} = await installPaymentFixture(page);
  await page.route("http://127.0.0.1:6300/**", route => route.abort());
  await page.goto("/");
  await page.getByRole("button",{name:"Connect Wallet"}).click();
  await page.getByRole("button",{name:"1AM",exact:true}).click();
  await expect(page.getByRole("button",{name:/(Continue|Login) with Passkey/})).toBeVisible();
  await page.getByRole("button",{name:"Use recovery passphrase instead"}).click();
  await expect(page.getByText("At least 7 characters.",{exact:false})).toBeVisible();
  await expect(page.getByText("Create / recover a payment escrow",{exact:true})).toHaveCount(0);
  await expect(page.getByLabel("Total NIGHT",{exact:true})).toHaveText("100");
  await page.screenshot({path:"reports/revision/connected-locked.png"});
  await page.getByLabel("Local recovery passphrase",{exact:true}).first().fill("synthetic local browser passphrase");
  await page.getByRole("button",{name:"Secure MoneyMole",exact:true}).click();
  await page.getByLabel("Escrow address",{exact:true}).fill(contract);
  await page.getByRole("button",{name:"Use escrow",exact:true}).click();
  await expect(page.getByRole("button",{name:"Send NIGHT"})).toBeVisible({timeout:60_000});
  await page.screenshot({path:"reports/revision/unlocked-send.png"});
  await page.getByLabel("Amount in NIGHT").fill("0");
  await expect(page.getByRole("button",{name:"Send NIGHT"})).toBeDisabled();
  await expect(page.getByText("Enter a positive NIGHT amount", {exact:false})).toBeVisible();
  await page.getByLabel("Amount in NIGHT").fill("0.0000001");
  await expect(page.getByRole("button",{name:"Send NIGHT"})).toBeDisabled();
  await page.getByLabel("Amount in NIGHT").fill("1.234567");
  await page.evaluate(() => { (window as unknown as {syntheticNightBalance:string}).syntheticNightBalance="98765433"; });
  await page.getByRole("button",{name:"Send NIGHT"}).click();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByLabel("Total NIGHT",{exact:true})).toHaveText("98.765433");
  await expect(page.getByRole("button",{name:"Retry this step",exact:true})).toBeVisible({timeout:60_000});
  await expect(page.locator(".wizard-amount")).toContainText("1.234567 NIGHT");
  await expect(page.getByRole("button",{name:"Approve funding of 1.234567"})).toBeHidden();
  await expect(page.getByRole("button",{name:"Show claim link / QR"})).toHaveCount(0);
  await page.locator(".state-view").evaluate(el => Promise.all(el.getAnimations().map(a => a.finished)));
  await page.screenshot({path:"reports/revision/saved-draft.png"});
  await page.setViewportSize({width:390,height:844});
  await page.getByRole("button",{name:"Retry this step",exact:true}).scrollIntoViewIfNeeded();
  const prepareBox = await page.getByRole("button",{name:"Retry this step",exact:true}).boundingBox();
  expect(prepareBox!.y + prepareBox!.height).toBeLessThan(844);
  await page.screenshot({path:"reports/revision/saved-draft-mobile.png"});
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole("button",{name:"Close and resume later"}).click();
  await page.getByRole("button",{name:"Lock workspace"}).click();
  await expect(page.getByRole("button",{name:"Prepare funding",exact:true})).toHaveCount(0);
  await page.getByRole("button",{name:"Use recovery passphrase instead"}).click();
  await page.getByLabel("Local recovery passphrase",{exact:true}).first().fill("synthetic local browser passphrase");
  await page.getByRole("button",{name:"Unlock MoneyMole",exact:true}).click();
  await expect(page.getByLabel("Select payment")).toBeVisible({timeout:60_000});
  await page.getByLabel("Select payment").selectOption({index:1});
  await expect(page.getByText("funding not verified this session",{exact:false})).toBeHidden();
  await page.getByRole("button",{name:"Activity",exact:true}).click();
  await page.getByLabel("Select payment").selectOption({index:1});
  await expect(page.getByRole("button",{name:"Prepare funding",exact:true})).toHaveCount(0);
  await expect(page.getByLabel("Amount in NIGHT")).toHaveCount(0);
  await expect(page.getByLabel("Claim link or token")).toHaveCount(0);
  const beforeExpand = await page.locator(".payment-app").boundingBox();
  await page.getByText("Transaction details",{exact:true}).click();
  expect((await page.locator(".payment-app").boundingBox())!.height).toBe(beforeExpand!.height);
  expect(await page.locator(".wallet-scroll").evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
  await expect(page.getByText("funding not verified this session",{exact:false})).toBeVisible();
  await page.getByRole("button",{name:"Receive",exact:true}).click();
  await expect(page.getByLabel("Claim link or token")).toBeVisible();
  await expect.poll(() => page.locator(".wallet-scroll").evaluate(el => el.scrollTop)).toBe(0);
  await expect(page.getByRole("button",{name:"Prepare funding",exact:true})).toHaveCount(0);
  await page.setViewportSize({width:390,height:844});
  await page.locator(".state-view").evaluate(el => Promise.all(el.getAnimations().map(a => a.finished)));
  await page.screenshot({path:"reports/revision/connected-receive-mobile.png"});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(()=>(window as unknown as {syntheticTransactionCalls:number}).syntheticTransactionCalls)).toBe(0);
});

for (const width of [320,390,768,1440]) {
  test(`responsive actions remain focused at ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:900});
    await page.goto("/");
    const frame = await page.locator(".payment-app").boundingBox();
    await page.getByRole("button",{name:"Receive",exact:true}).click();
    await expect(page.getByRole("heading",{name:"A payment, just a link away."})).toBeVisible();
    await expect(page.getByLabel("Amount in NIGHT")).toHaveCount(0);
    await page.getByRole("button",{name:"Activity",exact:true}).click();
    await expect(page.getByRole("heading",{name:"Your payments live with you."})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button",{name:"Send",exact:true}).click();
    expect((await page.locator(".payment-app").boundingBox())!.height).toBe(frame!.height);
    await page.getByRole("button",{name:"Connect Wallet"}).scrollIntoViewIfNeeded();
    const box=await page.getByRole("button",{name:"Connect Wallet"}).boundingBox();
    expect(box!.y+box!.height).toBeLessThan(900);
  });
}

test("wallet modal supports cancellation",async({page})=>{
  await page.addInitScript(()=>{
    Object.assign(window,{midnight:{synthetic:{name:"1AM",rdns:"com.midnight.1am",apiVersion:"4.0.1",icon:"",connect:()=>new Promise(()=>{})}}});
  });
  await page.goto("/");
  await page.getByRole("button",{name:"Connect Wallet"}).click();
  await page.getByRole("button",{name:"1AM",exact:true}).click();
  await expect(page.getByRole("button",{name:"1AM"})).toBeDisabled();
  await page.getByRole("button",{name:"Close Connect Wallet"}).click();
  await expect(page.getByText("Connection cancelled.",{exact:false})).toBeVisible();
});

test("tools focus returns to its trigger and the connected toast obeys CSP",async({page})=>{
  await installPaymentFixture(page);
  await page.addInitScript(()=>{
    Object.assign(window,{violations:[] as string[]});
    document.addEventListener("securitypolicyviolation",e=>(window as unknown as {violations:string[]}).violations.push(e.violatedDirective));
  });
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
  await page.getByRole("button",{name:"Connect Wallet"}).click();
  await page.getByRole("button",{name:"1AM",exact:true}).click();
  await expect(page.locator("[data-sonner-toast]").filter({hasText:"1AM connected"})).toBeVisible();
  await page.getByRole("button",{name:"Open workspace tools"}).click();
  await expect(page.getByRole("dialog",{name:"Tools"})).toBeVisible();
  await expect(page.getByRole("dialog").getByText("Create / recover a payment escrow",{exact:true})).toBeVisible();
  await expect(page.getByText("Test asset issuer administration", {exact:true})).toHaveCount(0);
  await page.screenshot({path:"reports/revision/tools.png"});
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button",{name:"Open workspace tools"})).toBeFocused();
  expect(await page.evaluate(()=>(window as unknown as {violations:string[]}).violations)).toEqual([]);
});
test("rejected connection can be retried without entering the payment workspace", async ({page}) => {
  await page.addInitScript(() => {
    Object.assign(window, {midnight:{synthetic:{name:"1AM",rdns:"com.midnight.1am",apiVersion:"4.0.1",icon:"",
      connect:async()=>{ throw {code:"PermissionRejected"}; },
    }}});
  });
  await page.goto("/");
  await page.getByRole("button",{name:"Connect Wallet"}).click();
  await page.getByRole("button",{name:"1AM",exact:true}).click();
  await expect(page.locator(".connection-status")).toContainText("declined");
  await expect(page.getByRole("button",{name:"1AM",exact:true})).toBeEnabled();
  await expect(page.getByRole("button",{name:"Unlock payment workspace"})).toHaveCount(0);
});
