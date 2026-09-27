import type { Metadata } from "next";
import { connection } from "next/server";
import "sonner/dist/styles.css";
import "./globals.css";
import { ProductFeedback } from "@/components/product-feedback";
export const metadata: Metadata = {
  title: "MoneyMole | Private payments",
  description: "Fund and claim non-redeemable shielded test payments on Midnight Preprod with 1AM.",
  icons: { icon: "/images/moneymole_logo.png", apple: "/images/moneymole_logo.png" },
  robots: { index: false, follow: false },
};
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to content</a><ProductFeedback>{children}</ProductFeedback></body></html>;
}
