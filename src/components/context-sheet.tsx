"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
/** Native dialog supplies focus trapping, Escape and return focus without touching wallet state. */
export function ContextSheet({ title, onClose, children, eyebrow = "Workspace tools" }: { title: string; onClose: () => void; children: ReactNode; eyebrow?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => { ref.current?.showModal(); }, []);
  function dismiss() { ref.current?.close(); onClose(); }
  return <dialog ref={ref} className="context-sheet" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); dismiss(); }} onClick={event => { if (event.target === event.currentTarget) dismiss(); }}><div className="sheet-content"><header><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2 id={titleId}>{title}</h2></div><button className="icon-button" onClick={dismiss} aria-label={`Close ${title}`}>×</button></header>{children}</div></dialog>;
}
