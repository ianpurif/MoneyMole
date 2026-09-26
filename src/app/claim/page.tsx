import Link from "next/link";
import { ClaimCapture } from "@/components/claim-capture";
export default function ClaimPage() {
  return <main className="mx-auto max-w-5xl px-5 py-10"><Link href="/" prefetch={false} className="text-sm underline">MoneyMole</Link><h1 className="mt-6 text-4xl font-semibold">Receive a private payment</h1><ClaimCapture /></main>;
}
