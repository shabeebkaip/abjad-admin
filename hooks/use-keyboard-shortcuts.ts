"use client";

import { useEffect } from "react";

export interface ShortcutBinding {
  key: string;                         // e.g. "j", "Enter", "Escape"
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
  description?: string;
  handler: (e: KeyboardEvent) => void;
}

/**
 * Global keyboard handler. Skips when focus is in an input / textarea so
 * single-key shortcuts (j/k/a/r) don't fight with typing.
 */
export function useKeyboardShortcuts(bindings: ShortcutBinding[], enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable;
      // Allow Esc to always fire (close drawer when focus is inside it).
      if (isEditable && e.key !== "Escape") return;

      for (const b of bindings) {
        if (b.key.toLowerCase() !== e.key.toLowerCase()) continue;
        if (!!b.ctrl !== e.ctrlKey) continue;
        if (!!b.shift !== e.shiftKey) continue;
        if (!!b.meta !== e.metaKey) continue;
        e.preventDefault();
        b.handler(e);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [bindings, enabled]);
}
