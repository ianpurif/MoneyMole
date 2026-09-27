"use client";
import { useEffect, useRef, useState } from "react";
import type { OneAmSession } from "@/lib/midnight/oneam";
import { Button } from "./ui/button";
import { downloadLocal } from "./download";
import { AdminRecovery } from "./admin-recovery";
import { useWallet } from "./wallet-provider";
import { useRecovery } from "./recovery-provider";
type Deployment = Awaited<ReturnType<OneAmSession["preparePaymentDeployment"]>>;
export function PaymentDeployment({
  session,
}: {
  session: OneAmSession;
}) {
  const { refreshBalances } = useWallet();
  const recovery = useRecovery();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    "Create an escrow only when you do not already have one. Keep its address and encrypted recovery file.",
  );
  const [review, setReview] = useState<ReturnType<Deployment["review"]> | null>(
    null,
  );
  const current = useRef<Deployment | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    current.current = recovery?.deployment ?? null;
    setReview(current.current?.review() ?? null);
    if (!recovery?.authenticated) { generation.current++; setBusy(false); }
  }, [recovery, recovery?.deployment, recovery?.authenticated]);
  useEffect(() => () => { generation.current++; }, []);
  async function run(
    action: "unlock" | "approve" | "check" | "export" | "backup",
  ) {
    const attempt = generation.current;
    setBusy(true);
    try {
      if (action === "unlock") {
        if (!recovery?.authenticated) throw new Error("Unlock MoneyMole first.");
        const opened = await recovery.prepareDeployment();
        if (attempt !== generation.current) {
          return;
        }
        current.current = opened;
        setReview(opened.review());
        setMessage(
          "Review Preprod and the escrow address before approving deployment. This action creates no payment and issues no tokens.",
        );
        if (opened.review().transactionId) {
          const next = await opened.reconcile();
          if (attempt === generation.current) setReview(next);
        }
      } else if (current.current) {
        if (action === "approve") {
          setMessage(`Approve escrow deployment in ${session.name}. DUST pays the fee.`);
          const next = await current.current.approve();
          if (attempt === generation.current) setReview(next);
        }
        if (action === "check") {
          const next = await current.current.reconcile();
          if (attempt === generation.current) setReview(next);
        }
        if (action === "export")
          downloadLocal(
            "moneymole-night-preprod-deployment.json",
            JSON.stringify(await current.current.publicRecord(), null, 2),
          );
        if (action === "backup")
          downloadLocal(
            "moneymole-encrypted-night-escrow.json",
            recovery!.backup(await current.current.exportEncrypted()),
          );
        if (
          attempt === generation.current &&
          current.current?.review().verified
        ) {
          setMessage(
            "Escrow confirmed on the finalized Preprod chain. Save its public deployment record and use this address.",
          );
        }
      }
      await recovery?.activateDeployment();
    } catch {
      if (attempt === generation.current)
        setMessage(
          "Deployment operation could not finish. Preserve the record, unlock if the tab was hidden, and reconcile any existing transaction before retrying.",
        );
    } finally {
      await refreshBalances();
      if (attempt === generation.current) {
        setBusy(false);
      }
    }
  }
  return (
    <details className="panel mt-6">
      <summary className="cursor-pointer font-medium">Create / recover a payment escrow</summary>
      <p className="mt-3 text-sm text-muted">
        Holds native Preprod NIGHT. Reuse a compatible NIGHT escrow; old
        test-token escrows cannot accept NIGHT.
      </p>
      <Button disabled={busy || !recovery?.authenticated || recovery.busy} onClick={() => void run("unlock")}>
        {review ? "Review escrow" : "Create / recover escrow"}
      </Button>
      {!recovery?.authenticated && <p className="small-note">Unlock MoneyMole once to continue.</p>}
      {review && (
        <div className="mt-4 space-y-3 text-sm">
          <p className="break-all">Preprod escrow: {review.address}</p>
          <p>
            State: {review.phase}{" "}
            {review.verified
              ? "· chain verified"
              : "· not verified in this session"}
          </p>
          {review.transactionId && (
            <p className="break-all">Transaction: {review.transactionId}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy || !!review.transactionId}
              onClick={() => void run("approve")}
            >
              Approve escrow deployment
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void run("check")}
            >
              Check deployment
            </Button>
            <Button
              variant="outline"
              disabled={busy || !recovery?.hasFallback}
              title={!recovery?.hasFallback ? "Add a recovery passphrase in Security first" : undefined}
              onClick={() => void run("backup")}
            >
              Save encrypted escrow recovery
            </Button>
            <Button
              variant="outline"
              disabled={busy || !review.verified}
              onClick={() => void run("export")}
            >
              Save public deployment record
            </Button>
          </div>
        </div>
      )}
      <p role="status" className="mt-3 text-sm text-muted">
        {message}
      </p>
      {recovery?.authenticated && !review && <AdminRecovery session={session} kind="escrow" />}
    </details>
  );
}
