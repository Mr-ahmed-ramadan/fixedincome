"use client";

import { useState } from "react";

/** The member's invite link with copy + one-tap sharing to WhatsApp, X, LinkedIn and Facebook. */
export function ShareLink({ url, text, copyLabel, copiedLabel }: { url: string; text: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  const message = `${text} ${url}`;
  const targets = [
    { name: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(message)}` },
    { name: "X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  ];

  async function copy() {
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* the user cancelled the share sheet */
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-paper p-1.5 ps-4" dir="ltr">
        <span className="min-w-0 flex-1 truncate text-sm font-medium" title={url}>{url.replace(/^https?:\/\//, "")}</span>
        <button type="button" onClick={copy} className="btn-primary shrink-0 px-4 py-2 text-sm">
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {targets.map((s) => (
          <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className="btn-ghost px-4 py-2 text-sm">
            {s.name}
          </a>
        ))}
      </div>
    </div>
  );
}
