import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";
export const metadata: Metadata = {
  title: "Private Payments | Engineering shell",
  description: "A preparation-stage Midnight payment application. Payment operations are not implemented.",
  robots: { index: false, follow: false },
};
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  return <html lang="en"><body>{children}</body></html>;
}
