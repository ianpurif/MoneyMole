import { WalletPanel } from "@/components/wallet-panel";
const steps = ["Connect wallet", "Fund payment", "Share link / QR", "Claim", "Verify"];
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8 sm:px-12">
      <header className="flex items-center justify-between gap-4 border-b border-border pb-6">
        <span className="text-base font-semibold tracking-tight">MoneyMole</span>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">Preprod · Test asset</span>
      </header>
      <section aria-labelledby="title" className="flex flex-1 flex-col justify-center py-20">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Shielded payments on Midnight</p>
        <h1 id="title" className="max-w-3xl text-5xl font-semibold leading-[1.08] tracking-tight sm:text-7xl">A private payment.<br />One claim link.</h1>
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">Fund an exact amount, share a private claim link, and let another wallet receive it. Connect 1AM on Preprod to get started.</p>
        <WalletPanel />
        <p className="mt-6 text-sm text-muted">Anyone holding a claim link can redeem it. Keep it private. Test units have no redemption value. Live acceptance of this implementation is pending.</p>
        <ol aria-label="Payment flow" className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-5">
          {steps.map((step, index) => <li key={step} className="rounded-xl border border-border p-4"><span className="text-xs text-muted">0{index + 1}</span><p className="mt-2 text-sm font-medium">{step}</p></li>)}
        </ol>
      </section>
      <footer className="border-t border-border pt-5 text-xs leading-relaxed text-muted">Local proving · Encrypted browser recovery · No automatic expiry or refund. Settlement is confirmed against Preprod; a proof alone is not a payment.</footer>
    </main>
  );
}
