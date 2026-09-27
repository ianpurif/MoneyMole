"use client";
import { useEffect, useRef, useState } from "react";
import type { OneAmSession } from "@/lib/midnight/oneam";
import { Button } from "./ui/button";
import { downloadLocal } from "./download";
import { AdminRecovery } from "./admin-recovery";
import { useWallet } from "./wallet-provider";
type Deployment = Awaited<ReturnType<OneAmSession["preparePaymentDeployment"]>>;
export function PaymentDeployment({
  session,
  onSelect,
}: {
  session: OneAmSession;
  onSelect: (address: string) => void;
}) {
  const { refreshBalances } = useWallet();
  const [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    "Create an escrow only when you do not already have one. Keep its address and encrypted recovery file.",
  );
  const [review, setReview] = useState<ReturnType<Deployment["review"]> | null>(
    null,
  );
  const current = useRef<Deployment | null>(null);
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
      current.current?.lock();
    },
    [],
  );
  const unlocked = review !== null;
  useEffect(() => {
    const lock = () => {
      generation.current++;
      current.current?.lock();
      current.current = null;
      setReview(null);
      setPassword("");
      setBusy(false);
      setMessage(
        "Escrow setup locked. Unlock the existing record to continue.",
      );
    };
    const hide = () => {
      if (document.visibilityState === "hidden") lock();
    };
    document.addEventListener("visibilitychange", hide);
    const timer = unlocked ? setTimeout(lock, 5 * 60_000) : undefined;
    return () => {
      document.removeEventListener("visibilitychange", hide);
      clearTimeout(timer);
    };
  }, [unlocked]);
  async function run(
    action: "unlock" | "approve" | "check" | "export" | "backup",
  ) {
    const attempt = generation.current;
    setBusy(true);
    try {
      if (action === "unlock") {
        current.current?.lock();
        const opened = await session.preparePaymentDeployment(password);
        if (attempt !== generation.current) {
          opened.lock();
          return;
        }
        current.current = opened;
        setPassword("");
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
            await current.current.exportEncrypted(),
          );
        if (
          attempt === generation.current &&
          current.current?.review().verified
        ) {
          setMessage(
            "Escrow confirmed on the finalized Preprod chain. Save its public deployment record and use this address.",
          );
          onSelect(current.current.review().address);
        }
      }
    } catch {
      if (attempt === generation.current)
        setMessage(
          "Deployment operation could not finish. Preserve the record, unlock if the tab was hidden, and reconcile any existing transaction before retrying.",
        );
    } finally {
      await refreshBalances();
      if (attempt === generation.current) {
        setPassword("");
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
      <label className="field">
        Local recovery passphrase
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
        />
      </label>
      <Button
        disabled={busy || password.length < 16}
        onClick={() => void run("unlock")}
      >
        Prepare / unlock escrow
      </Button>
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
              disabled={busy}
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
      {!review && <AdminRecovery session={session} kind="escrow" />}
    </details>
  );
}
