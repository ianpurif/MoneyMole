import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Private Payments | Engineering shell",
  description: "A preparation-stage Midnight payment application. Payment operations are not implemented.",
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
