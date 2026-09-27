import { getImageProps } from "next/image";
import Link from "next/link";

function BrandImage({ size, alt, priority = false }: { size: number; alt: string; priority?: boolean }) {
  const { props } = getImageProps({ src: "/images/moneymole_logo.png", width: size, height: size, alt, priority });
  // Next's default color:transparent style is unnecessary and conflicts with
  // nonce-only SSR styles. Retain its optimized URLs, sizing and lazy loading.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} style={undefined} alt={alt} />;
}

export function ProductHeader() {
  return <header className="site-header"><Link href="/" className="wordmark" aria-label="MoneyMole home"><BrandImage size={36} alt="" priority />MoneyMole<span className="network-label">PREPROD</span></Link><nav aria-label="Main navigation"><Link href="/#how-it-works">How it works</Link><Link href="/#privacy">Privacy</Link><a className="header-action" href="#payment">Open app <span aria-hidden="true">↗</span></a></nav></header>;
}

export function ProductStory() {
  return <div className="product-story">
    <section id="how-it-works" className="story-intro" aria-labelledby="story-title"><div><p className="eyebrow">A little link. A different way to pay.</p><h2 id="story-title">From your wallet.<br />To their world.</h2><p className="story-description">Put a payment in a link. Share it privately. The person holding it claims with their own wallet, even after you go offline.</p></div><div className="brand-object"><BrandImage size={330} alt="MoneyMole, a mole finding its own quiet way" /><span className="object-caption">Small footprint. Clear purpose.</span></div></section>
    <section className="journey" aria-label="How a payment works"><article><span className="step-number">01 / FUND</span><h3>Set it aside.</h3><p>Choose an exact amount. Approve with 1AM. Your link is ready only when funding is finalized.</p></article><article><span className="step-number">02 / SHARE</span><h3>Pass it quietly.</h3><p>Send the private link or a locally generated QR. Anyone holding it can claim, so choose where you share.</p></article><article><span className="step-number">03 / CLAIM</span><h3>Make it theirs.</h3><p>A separate wallet claims the funded value. No replacement tokens. No need for the sender to stay online.</p></article></section>
    <section id="privacy" className="privacy-story" aria-labelledby="privacy-title"><div><p className="eyebrow">Privacy, with boundaries.</p><h2 id="privacy-title">Some things should<br />stay with you.</h2><p>Your wallet authorizes. Your browser holds private records. Your trusted local prover prepares proofs.</p><span className="privacy-mark" aria-hidden="true">↳</span></div><div className="privacy-details"><details open><summary>Private by design</summary><p>Claim secrets and private state stay client-side. Recovery records are encrypted on this device. Claim links use a fragment that is captured locally and removed from the address bar.</p></details><details><summary>What the network can see</summary><p>Contract activity and transaction metadata are public. Shielded value does not make every interaction anonymous. Real payment and disclosure acceptance for this implementation is still pending.</p></details><details><summary>Your link is the key</summary><p>Anyone with the link, including the sender, can attempt to claim. There is no recipient identity guarantee, automatic expiry, or refund. A lost link or recovery passphrase can mean lost access.</p></details><details><summary>A test network, clearly labeled</summary><p>MoneyMole currently uses non-redeemable test units on Midnight Preprod. DUST covers network fees. These units have no redemption value.</p></details></div></section>
  </div>;
}

export function ProductFooter() {
  return <footer className="site-footer"><Link href="/" className="wordmark">MoneyMole<span aria-hidden="true">↗</span></Link><p>Quietly, on Midnight.</p><span>Preprod · Non-redeemable test asset</span></footer>;
}
