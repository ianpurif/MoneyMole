"use client";
import { useEffect, useRef, type ReactNode } from "react";
/** Native dialog supplies focus trapping, Escape and return focus without touching wallet state. */
export function ContextSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  function dismiss() { ref.current?.close(); onClose(); }
  return <dialog ref={ref} className="context-sheet" aria-labelledby="sheet-title" onCancel={event => { event.preventDefault(); dismiss(); }} onClick={event => { if (event.target === event.currentTarget) dismiss(); }}><div className="sheet-content"><header><div><p className="eyebrow">Workspace tools</p><h2 id="sheet-title">{title}</h2></div><button className="icon-button" onClick={dismiss} aria-label="Close tools">×</button></header>{children}</div></dialog>;
}
