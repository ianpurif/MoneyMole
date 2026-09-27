import { WalletPanel } from "@/components/wallet-panel";
import { ProductFooter, ProductHeader, ProductStory } from "@/components/product-shell";
export default function Home() {
  return <><ProductHeader /><main id="main-content"><section className="product-stage" aria-labelledby="title"><h1 id="title">Send NIGHT. <span>SHARE A CLAIM</span></h1><div id="payment" className="app-anchor"><WalletPanel /></div><p className="stage-description">Native NIGHT. One bearer claim link.<br />From one wallet to another, on your terms.</p></section><ProductStory /></main><ProductFooter /></>;
}
