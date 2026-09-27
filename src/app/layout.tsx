import type { Metadata } from "next";
import { connection } from "next/server";
import "sonner/dist/styles.css";
import "./globals.css";
import { ProductFeedback } from "@/components/product-feedback";
import { WalletProvider } from "@/components/wallet-provider";
import { RecoveryProvider } from "@/components/recovery-provider";
import logo from "../../public/images/moneymole_logo.png";
export const metadata: Metadata = {
  title: "MoneyMole | Private payments",
  description: "Escrow and claim native NIGHT on Midnight Preprod with 1AM. Public transfers, private claim secrets, DUST fees.",
  icons: { icon: logo.src, apple: logo.src },
  robots: { index: false, follow: false },
};
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to content</a><ProductFeedback><WalletProvider><RecoveryProvider>{children}</RecoveryProvider></WalletProvider></ProductFeedback></body></html>;
}
