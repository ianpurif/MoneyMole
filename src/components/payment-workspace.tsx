"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { parseAmount, formatAmount } from "@/domain/amount";
import type { OneAmSession } from "@/lib/midnight/oneam";
import type { PaymentView } from "@/lib/midnight/payments";
import { decodeClaim, extractClaim } from "@/lib/midnight/payment-codec";
import { Button } from "./ui/button";
import { PaymentDeployment } from "./payment-deployment";
import { WalletCard } from "./wallet-card";
import { downloadLocal } from "./download";
import { ContextSheet } from "./context-sheet";
import { useWallet } from "./wallet-provider";
import { useRecovery } from "./recovery-provider";
import { RecoveryAccess } from "./recovery-access";
import { validPassphrase } from "@/lib/private-state/passphrase";
import { RecoveryWorkspaceMismatch } from "@/lib/private-state/storage-identity";
import { PaymentWizard } from "./payment-wizard";
import { paymentErrorMessage } from "@/lib/midnight/payment-errors";
const phaseLabel = (phase: PaymentView["phase"]) => ({ draft: "Not sent", prepared: "Ready for approval", authorization_requested: "Awaiting approval", outcome_unknown: "Checking confirmation", submitted: "Confirming", finalized: "Confirmed", failed: "Needs attention" })[phase];
const night = (atomic: string) => formatAmount(BigInt(atomic), 6);
export function PaymentWorkspace({
  session,
  claimToken,
  onClaimConsumed,
  initialAction = "send",
  initialAmount = "10",
  onDisconnect,
}: {
  onDisconnect: () => void;
  session: OneAmSession;
  claimToken?: string;
  onClaimConsumed?: () => void;
  initialAction?: "send" | "receive" | "activity";
  initialAmount?: string;
}) {
  const { balances, balancesStale } = useWallet();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const recovery = useRecovery();
  const paymentController = recovery?.payments ?? null;
  const controller = { current: paymentController };
  const generation = useRef(0);
  const scrollArea = useRef<HTMLDivElement>(null);
  const [contract, setContract] = useState("");
  const [amount, setAmount] = useState(initialAmount),
    [claim, setClaim] = useState("");
  const [busy, setBusy] = useState(false);
  const unlocked = !!paymentController;
  const [asset, setAsset] = useState("");
  const [records, setRecords] = useState<PaymentView[]>([]),
    [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [importPassword, setImportPassword] = useState("");
  const [tab, setTab] = useState<"send" | "receive" | "activity">(
    initialAction,
  );
  useEffect(() => {
    scrollArea.current?.scrollTo({ top: 0 });
  }, [tab, unlocked]);
  let amountValid = false;
  try {
    parseAmount(amount, 6);
    amountValid = true;
  } catch {
    /* Inline validation only; the controller still validates. */
  }
  const visibleRecords = records.filter(r => tab === "activity" || (tab === "receive" ? r.role === "receiver" : r.role === "sender" || r.claimed));
  const current = visibleRecords.find((r) => r.id === selected);
  function lock() {
    generation.current++;
    recovery?.lock();
    setRecords([]);
    setSelected("");

    setClaim("");
    setImportPassword("");
    setBusy(false);
    toast.dismiss();
    setMessage(
      "MoneyMole locked. Use your passkey or recovery passphrase with the same wallet to continue.",
    );
  }
  useEffect(() => {
    const lifetime = generation, attempt = ++lifetime.current;
    queueMicrotask(() => {
      if (attempt !== lifetime.current) return;
      setRecords([]); setSelected(""); setBusy(false);
      if (paymentController) {
        setAsset(paymentController.asset);
        void paymentController.list().then(list => { if (attempt === lifetime.current) setRecords(list); }).catch(() => { if (attempt === lifetime.current) setMessage("Saved records are unavailable. Unlock again to retry."); });
      }
    });
    return () => { lifetime.current++; };
  }, [paymentController]);
  useEffect(() => { let active = true; queueMicrotask(() => { if (active && recovery?.escrow) setContract(recovery.escrow); }); return () => { active = false; }; }, [recovery, recovery?.escrow]);
  useEffect(() => { let active = true; queueMicrotask(() => { if (active) { setClaim(recovery?.pendingClaim ?? ""); setImportPassword(""); } }); return () => { active = false; }; }, [recovery, recovery?.pendingClaim, recovery?.authenticated]);
  useEffect(() => {
    if (!claimToken || !recovery) return;
    let active = true;
    void recovery.captureClaim(claimToken)
      .then(() => {
        if (active) {
          setClaim(claimToken);
          setTab("receive");
          setMessage(
            "Claim captured locally and removed from the address bar. Unlock and save it before closing this tab.",
          );
          onClaimConsumed?.();
        }
      })
      .catch(() => {
        if (active)
          setMessage(
            "This claim link is unsupported or damaged. Ask the sender for the original link.",
          );
      });
    return () => {
      active = false;
    };
  }, [claimToken, onClaimConsumed, recovery]);
  async function refresh() {
    const c = controller.current,
      attempt = generation.current;
    if (!c) return;
    const list = await c.list();
    if (attempt === generation.current) {
      setRecords(list);
    }
  }
  async function operate(action: () => Promise<void>) {
    const attempt = generation.current;
    setBusy(true);

    try {
      await action();
      if (attempt === generation.current) await refresh();
    } catch (error) {
      if (attempt === generation.current) {
        setMessage(
          error instanceof RecoveryWorkspaceMismatch ? error.message : paymentErrorMessage(error, "network"),
        );
        try {
          await refresh();
        } catch {
          /* Preserve stored recovery; never log private errors. */
        }
      }
    } finally {
      if (attempt === generation.current) setBusy(false);
    }
  }
  function openPayment(id?: string) {
    const flow = recovery!.getPaymentFlow();
    setWizardOpen(true);
    if (!flow.busy && id) void flow.resume(id);
  }
  function closeWizard() {
    setWizardOpen(false);
    const id = recovery?.paymentFlow?.payment?.id;
    if (id) setSelected(id);
    void refresh().catch(() => {});
  }
  return (
    <section aria-label="Payments" className="workspace" aria-busy={busy}>
      <WalletCard
        action={tab}
        onAction={(value) => {
          setTab(value);

          setSelected("");
          setMessage("");
        }}
        disabled={busy}
        connected
        balances={balances}
        balancesStale={balancesStale}
        walletName={session.name}
        controls={
          <>
            <button
              className="embroidered-button embroidered-light quiet-button"
              onClick={() => setToolsOpen(true)}
              aria-label="Open workspace tools"
            >
              Tools
            </button>
            {recovery?.authenticated && (
              <button className="embroidered-button embroidered-light quiet-button" onClick={lock}>
                Lock workspace
              </button>
            )}
            <button className="embroidered-button embroidered-light quiet-button" onClick={onDisconnect}>
              Disconnect
            </button>
          </>
        }
      />
      <div
        ref={scrollArea}
        className="wallet-scroll"
        tabIndex={0}
        role="region"
        aria-label="Payment content"
      >
        {!unlocked && tab === "receive" && (
          <details className="claim-address">
            <summary>Select escrow from a claim link</summary>
            <label className="field">
              Claim link or token
              <textarea
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                spellCheck={false}
                autoComplete="off"
                rows={3}
                disabled={busy}
              />
            </label>
            <Button
              variant="outline"
              disabled={busy || !claim}
              onClick={() =>
                void operate(async () => {
                  const p = await decodeClaim(extractClaim(claim));
                  setContract(p.contract);
                  await recovery?.captureClaim(extractClaim(claim));
                  setMessage(
                    "Claim address selected. Unlock the workspace and save the claim.",
                  );
                })
              }
            >
              Use claim escrow
            </Button>
          </details>
        )}
        {!recovery?.authenticated && <RecoveryAccess />}
        {recovery?.authenticated && !unlocked && <div className="panel">
          <label className="field">Escrow address<input value={contract} onChange={event => setContract(event.target.value.trim())} autoComplete="off" spellCheck={false} disabled={recovery.busy} /></label>
          <Button disabled={recovery.busy || !/^[a-f0-9]{64}$/.test(contract)} onClick={() => void recovery.selectEscrow(contract)}>Use escrow</Button>
          <p role="status" className="small-note">{recovery.message || "Use an existing escrow, or create / recover one in Tools."}</p>
        </div>}
        {unlocked && recovery?.paymentFlow && recovery.paymentFlow.stage !== "success" && <Button variant="outline" onClick={() => setWizardOpen(true)}>Resume payment</Button>}
        {unlocked && (
          <div key={tab} className="state-view">
            {tab === "send" ? (
              <div className="panel">
                <div className="flow-heading">
                  <h2>Send NIGHT.</h2>
                  <p>
                    Fund a bearer claim link. NIGHT amounts and addresses are
                    public.
                  </p>
                </div>
                <label className="field amount-entry">
                  Amount in NIGHT
                  <input
                    aria-invalid={!amountValid}
                    aria-describedby="amount-help"
                    maxLength={46}
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={busy}
                  />
                </label>
                <p className="mb-3 text-sm text-muted">
                  Sharing unlocks after funding is finalized. DUST covers
                  network fees.
                </p>
                <p id="amount-help" className="field-error">
                  {!amountValid
                    ? "Enter a positive NIGHT amount with up to 6 decimal places."
                    : ""}
                </p>
                <Button
                  className="primary-action"
                  disabled={!unlocked || busy || !amountValid}
                  onClick={() => {
                    const flow = recovery!.getPaymentFlow(); setWizardOpen(true);
                    if (!flow.busy) void flow.start({ amount });
                  }}
                >
                  Send NIGHT
                </Button>
              </div>
            ) : tab === "receive" ? (
              <div className="panel">
                <h3 className="font-medium">Open a bearer claim</h3>
                <label className="field">
                  Claim link or token
                  <textarea
                    value={claim}
                    onChange={(e) => setClaim(e.target.value)}
                    spellCheck={false}
                    autoComplete="off"
                    rows={3}
                    disabled={busy}
                  />
                </label>
                <p className="mb-3 text-sm text-muted">
                  The link stays in this browser. If using a different escrow,
                  it will be selected automatically.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={!unlocked || busy || !claim}
                    onClick={() => {
                      try {
                        const flow = recovery!.getPaymentFlow(); setWizardOpen(true);
                        if (!flow.busy) void flow.start({ claim: extractClaim(claim) });
                      } catch { setMessage("Paste the original MoneyMole claim link to continue."); }
                    }}
                  >
                    Receive NIGHT
                  </Button>
                </div>
              </div>
            ) : null}
            {tab === "activity" && (
              <div className="panel activity-panel">
                <h2 className="section-heading">
                  Payment history
                </h2>
                {visibleRecords.length === 0 && (
                  <div className="empty-history">
                    <span aria-hidden="true">↺</span>
                    <h3>A quiet start.</h3>
                    <p>
                      Your saved payments will appear here. Send a payment,
                      receive a claim, or import encrypted recovery in Tools.
                    </p>
                  </div>
                )}
                {!current && (
                  <p className="mt-2 text-xs text-muted">
                    Reloaded records need reconciliation before their state can
                    be verified.
                  </p>
                )}
                {visibleRecords.length > 0 && (
                  <label className="field">
                    Select payment
                    <select
                      value={selected}
                      onChange={(e) => {
                        setSelected(e.target.value);

                      }}
                    >
                      <option value="">Select a saved payment</option>
                      {visibleRecords.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.role === "sender" ? "Send" : "Receive"}{" "}
                          {night(r.amount)} · {phaseLabel(r.phase)} · {r.id.slice(2, 10)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {current && (
                  <div className="space-y-3 text-sm">
                    <div className="payment-summary">
                      <span>
                        {current.role === "sender" ? "Sending" : "Receiving"}
                      </span>
                      <strong>
                        {night(current.amount)} <small>NIGHT</small>
                      </strong>
                      <span className="phase-label">
                        {phaseLabel(current.phase)}
                      </span>
                    </div>
                    {tab === "activity" && <details>
                      <summary>Transaction details</summary>
                      <p>
                        Saved failed attempts: {current.failedAttempts} ·
                        Transaction: {phaseLabel(current.phase)} ·{" "}
                        {current.funded
                          ? "funding verified"
                          : "funding not verified this session"}
                        {current.spent ? " · already claimed" : ""}
                      </p>
                      {current.transactionId && (
                        <p className="break-all">
                          Identifier: {current.transactionId}
                        </p>
                      )}
                      {current.blockHash && (
                        <p className="break-all">
                          Finalized block: {current.blockHash}
                        </p>
                      )}
                    </details>}
                    <Button disabled={busy} onClick={() => openPayment(current.id)}>Open payment</Button>
                    {tab === "activity" && <Button variant="outline" disabled={busy} onClick={() => { setTab(current.role === "sender" ? "send" : "receive"); setMessage(""); }}>
                      {current.role === "sender" ? "Open in Send" : "Open in Receive"}
                    </Button>}
                    {tab === "activity" && <details>
                      <summary>Recovery & receipts</summary>
                      <div className="transaction-actions">
                        <Button
                          variant="outline"
                          disabled={busy || !recovery?.hasFallback}
                          title={!recovery?.hasFallback ? "Add a recovery passphrase in Tools → Security first" : undefined}
                          onClick={() =>
                            void operate(async () =>
                              downloadLocal(
                                "moneymole-encrypted-payment.json",
                                recovery!.backup(await controller.current!.exportEncrypted(
                                  current.id,
                                )),
                              ),
                            )
                          }
                        >
                          Save encrypted recovery
                        </Button>
                        <Button
                          variant="outline"
                          disabled={busy || !current.funded}
                          onClick={() =>
                            void operate(async () =>
                              downloadLocal(
                                "moneymole-public-receipt.json",
                                JSON.stringify(
                                  await controller.current!.receipt(current.id),
                                  null,
                                  2,
                                ),
                              ),
                            )
                          }
                        >
                          Save public receipt
                        </Button>
                      </div>
                    </details>}

                  </div>
                )}

              </div>
            )}
          </div>
        )}
        {message && <p role="status" aria-live="polite" className="workspace-status">
          {busy && <span className="busy-indicator" aria-hidden="true" />}
          {message}
        </p>}
      </div>
      {wizardOpen && recovery?.paymentFlow && <PaymentWizard flow={recovery.paymentFlow} onClose={closeWizard} />}
      {toolsOpen && <ContextSheet title="Tools" onClose={() => setToolsOpen(false)}>
        <RecoveryAccess security />
        <PaymentDeployment session={session} />
        {unlocked && <>
                <details className="mt-5">
                  <summary className="cursor-pointer font-medium">
                    Import encrypted payment recovery
                  </summary>
                  <label className="field">
                    Original export passphrase
                    <input
                      type="password"
                      value={importPassword}
                      onChange={(e) => setImportPassword(e.target.value)}
                      autoComplete="off"
                      disabled={busy}
                    />
                  </label>
                  <label className="field">
                    Recovery JSON file
                    <input
                      type="file"
                      accept="application/json,.json"
                      disabled={busy || !validPassphrase(importPassword)}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 1_500_000) {
                          setMessage("Recovery file is too large.");
                          return;
                        }
                        void operate(async () => {
                          const v = await recovery!.importPayment(
                            await file.text(),
                            importPassword,
                          );
                          setSelected(v.id);
                          setTab("activity");
                          setToolsOpen(false);
                          setImportPassword("");
                          setMessage(
                            "Encrypted record imported. Open payment to verify its current state.",
                          );
                        });
                        e.target.value = "";
                      }}
                    />
                  </label>
                </details>
        </>}
        {unlocked && (
          <details className="workspace-info">
            <summary>Asset & workspace details</summary>
            <p className="break-all text-xs text-muted">Asset: {asset}</p>
            <p className="break-all text-xs text-muted">Escrow: {contract}</p>
            <p className="text-xs text-muted">
              Native Preprod NIGHT · 6 decimals · public amounts and addresses.
              DUST covers fees. MoneyMole locks after five minutes without interaction,
              when disconnected, or when this page is closed.
            </p>
          </details>
        )}

      </ContextSheet>}
    </section>
  );
}
