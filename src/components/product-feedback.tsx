"use client";
import dynamic from "next/dynamic";
// Sonner emits inline position variables in SSR HTML. Mount it client-side so
// React applies CSS properties directly under the unchanged nonce-only CSP.
const Toaster = dynamic(() => import("sonner").then(module => module.Toaster), { ssr: false });
export function ProductFeedback({ children }: { children: React.ReactNode }) {
  return <>{children}<Toaster position="bottom-right" closeButton visibleToasts={2} toastOptions={{ className: "mole-toast", duration: 4500 }} /></>;
}
