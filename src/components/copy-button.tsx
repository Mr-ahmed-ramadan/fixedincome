"use client";

import { useState } from "react";

/** Small "Copy" button for admin links. */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
      className="rounded-full px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/30 hover:bg-primary/5"
    >
      {done ? "Copied" : label}
    </button>
  );
}
