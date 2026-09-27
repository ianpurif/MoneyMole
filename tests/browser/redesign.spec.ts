import { mkdir } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { installPaymentFixture } from "./support/payment-fixture";

test("focused synthetic payment workspace saves, validates and recovers a real encrypted draft", async ({page}) => {
  test.setTimeout(90_000);
  await mkdir("reports/revision", { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const {contract} = await installPaymentFixture(page);
  await page.goto("/");
  await page.getByRole("button",{name:"Check for 1AM"}).click();
  await page.getByRole("button",{name:"Connect 1AM",exact:true}).click();
  await expect(page.getByRole("button",{name:"Unlock payment workspace"})).toBeVisible();
  await page.screenshot({path:"reports/revision/connected-locked.png"});
  await page.getByLabel("Preprod escrow address",{exact:true}).fill(contract);
  await page.getByLabel("Local recovery passphrase",{exact:true}).first().fill("synthetic local browser passphrase");
  await page.getByRole("button",{name:"Unlock payment workspace"}).click();
  await expect(page.getByRole("button",{name:"Save payment draft"})).toBeVisible({timeout:60_000});
  await page.screenshot({path:"reports/revision/unlocked-send.png"});
  await page.getByLabel("Amount in NIGHT").fill("0");
  await expect(page.getByRole("button",{name:"Save payment draft"})).toBeDisabled();
  await expect(page.getByText("Enter a positive NIGHT amount", {exact:false})).toBeVisible();
  await page.getByLabel("Amount in NIGHT").fill("0.0000001");
  await expect(page.getByRole("button",{name:"Save payment draft"})).toBeDisabled();
  await page.getByLabel("Amount in NIGHT").fill("1.234567");
  await page.getByRole("button",{name:"Save payment draft"}).click();
  await expect(page.getByRole("button",{name:"Activity",exact:true})).toHaveAttribute("aria-pressed","true");
  await expect(page.getByRole("button",{name:"Prepare funding",exact:true})).toBeVisible();
  await expect(page.locator(".payment-summary")).toContainText("1.234567 NIGHT");
  await expect(page.getByRole("button",{name:"Approve funding of 1.234567"})).toBeHidden();
  await expect(page.getByRole("button",{name:"Show claim link / QR"})).toHaveCount(0);
  await page.locator(".state-view").evaluate(el => Promise.all(el.getAnimations().map(a => a.finished)));
  await page.screenshot({path:"reports/revision/saved-draft.png"});
  await page.setViewportSize({width:390,height:844});
  await page.getByRole("button",{name:"Prepare funding",exact:true}).scrollIntoViewIfNeeded();
  const prepareBox = await page.getByRole("button",{name:"Prepare funding",exact:true}).boundingBox();
  expect(prepareBox!.y + prepareBox!.height).toBeLessThan(844);
  await page.screenshot({path:"reports/revision/saved-draft-mobile.png"});
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole("button",{name:"Lock workspace"}).click();
  await expect(page.getByRole("button",{name:"Prepare funding",exact:true})).toHaveCount(0);
  await page.getByLabel("Local recovery passphrase",{exact:true}).first().fill("synthetic local browser passphrase");
  await page.getByRole("button",{name:"Unlock payment workspace"}).click();
  await expect(page.getByLabel("Select payment")).toBeVisible({timeout:60_000});
  await page.getByLabel("Select payment").selectOption({index:1});
  await expect(page.getByText("funding not verified this session",{exact:false})).toBeHidden();
  const beforeExpand = await page.locator(".payment-app").boundingBox();
  await page.getByText("Transaction details",{exact:true}).click();
  expect((await page.locator(".payment-app").boundingBox())!.height).toBe(beforeExpand!.height);
  expect(await page.locator(".wallet-scroll").evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
  await expect(page.getByText("funding not verified this session",{exact:false})).toBeVisible();
  await page.getByRole("button",{name:"Receive",exact:true}).click();
  await expect(page.getByLabel("Claim link or token")).toBeVisible();
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
    await page.getByRole("button",{name:"Check for 1AM"}).scrollIntoViewIfNeeded();
    const box=await page.getByRole("button",{name:"Check for 1AM"}).boundingBox();
    expect(box!.y+box!.height).toBeLessThan(900);
  });
}

test("wallet waiting and cancellation stay inline",async({page})=>{
  await page.addInitScript(()=>{
    Object.assign(window,{midnight:{synthetic:{name:"1AM",rdns:"com.midnight.1am",apiVersion:"4.0.1",icon:"",connect:()=>new Promise(()=>{})}}});
  });
  await page.goto("/");
  await page.getByRole("button",{name:"Check for 1AM"}).click();
  await page.getByRole("button",{name:"Connect 1AM",exact:true}).click();
  await expect(page.getByRole("button",{name:"Waiting for 1AM…"})).toBeDisabled();
  await page.getByRole("button",{name:"Cancel connection"}).click();
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
  await page.getByRole("button",{name:"Check for 1AM"}).click();
  await page.getByRole("button",{name:"Connect 1AM",exact:true}).click();
  await expect(page.locator("[data-sonner-toast]")).toContainText("1AM connected");
  await page.getByRole("button",{name:"Open workspace tools"}).click();
  await expect(page.getByRole("dialog",{name:"Advanced setup"})).toBeVisible();
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
  await page.getByRole("button",{name:"Check for 1AM"}).click();
  await page.getByRole("button",{name:"Connect 1AM",exact:true}).click();
  await expect(page.locator(".connection-status")).toContainText("declined");
  await expect(page.getByRole("button",{name:"Connect 1AM",exact:true})).toBeEnabled();
  await expect(page.getByRole("button",{name:"Unlock payment workspace"})).toHaveCount(0);
});
