import { Button } from "@/components/ui/button";
import { WalletPanel } from "@/components/wallet-panel";
const steps = ["Connect wallet", "Fund payment", "Share link / QR", "Claim", "Verify"];
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8 sm:px-12">
      <header className="flex items-center justify-between gap-4 border-b border-border pb-6">
        <span className="text-base font-semibold tracking-tight">Private Payments</span>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">Preprod · Preparation</span>
      </header>
      <section aria-labelledby="title" className="flex flex-1 flex-col justify-center py-20">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Midnight payment foundation</p>
        <h1 id="title" className="max-w-3xl text-5xl font-semibold leading-[1.08] tracking-tight sm:text-7xl">A private payment.<br />One claim link.</h1>
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">The intended flow is a funded, single-use transfer between independent wallets. You can connect 1AM on Preprod. Funding, claim links and transactions are unavailable while the payment protocol is being verified.</p>
        <WalletPanel />
        <div className="mt-8"><Button disabled aria-describedby="availability">Payment operations unavailable</Button></div>
        <p id="availability" className="mt-3 text-sm text-muted">Implementation and privacy validation are pending. No asset balances are shown.</p>
        <ol aria-label="Planned payment flow" className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-5">
          {steps.map((step, index) => <li key={step} className="rounded-xl border border-border p-4"><span className="text-xs text-muted">0{index + 1}</span><p className="mt-2 text-sm font-medium">{step}</p></li>)}
        </ol>
      </section>
      <footer className="border-t border-border pt-5 text-xs leading-relaxed text-muted">Engineering shell only. A proof or commitment is not evidence of asset settlement. Proposed test units are non-redeemable.</footer>
    </main>
  );
}
