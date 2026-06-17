"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CommandPalette } from "./command-palette";

interface Ctx {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}

const CommandPaletteContext = createContext<Ctx | null>(null);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used inside <CommandPaletteProvider>");
  return ctx;
}

/**
 * Tier 2 #15 — owns the palette's open state and the global ⌘K / Ctrl+K
 * shortcut. Mounted once at the admin layout level.
 *
 * Shortcut behavior
 *   - ⌘K (mac) / Ctrl+K (linux/windows) → toggle
 *   - Works even when focused inside inputs (this is the standard for
 *     command palettes — admins shouldn't lose access mid-typing)
 *   - Esc handled by the palette itself, not here
 */
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen, toggle }}>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </CommandPaletteContext.Provider>
  );
}
