import { ClaimCapture } from "@/components/claim-capture";
import { ProductFooter, ProductHeader } from "@/components/product-shell";
export default function ClaimPage() {
  return <><ProductHeader /><main id="main-content" className="claim-page"><p className="eyebrow">Someone sent something your way.</p><h1>Receive a NIGHT payment</h1><div id="payment"><ClaimCapture /></div><p className="claim-footnote">Only a finalized claim and a synchronized wallet confirm receipt.<br />Keep your link private. Anyone holding it can claim.</p></main><ProductFooter /></>;
}
