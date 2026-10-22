"use client";

import { useEffect, useState } from "react";

type Props = {
  links: (readonly [string, string])[];
  join: { href: string; label: string };
  switchLang: { href: string; label: string; hrefLang: string };
  labels: { menu: string; close: string };
};

/** Menu button and drop-down sheet for phones (the desktop nav is hidden below md). */
export function MobileNav({ links, join, switchLang, labels }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const close = () => setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", close);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("hashchange", close);
    };
  }, [open]);

  // Closing the sheet removes the link mid-click, which can cancel the browser's own
  // jump, so same-page anchors are scrolled to here.
  const go = (e: React.MouseEvent, href: string) => {
    setOpen(false);
    const url = new URL(href, window.location.href);
    const target = url.hash && url.pathname === window.location.pathname ? document.querySelector(url.hash) : null;
    if (!target) return;
    e.preventDefault();
    history.pushState(null, "", url.hash);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    target.scrollIntoView();
  };

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? labels.close : labels.menu}
        onClick={() => setOpen((o) => !o)}
        className="grid h-9 w-9 place-items-center rounded-full text-ink/80 transition hover:bg-ink/5"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <>
          <button type="button" aria-hidden tabIndex={-1} className="absolute inset-x-0 top-14 z-30 h-[100dvh] cursor-default bg-ink/20" onClick={() => setOpen(false)} />
          <nav id="mobile-menu" className="absolute inset-x-0 top-14 z-40 border-b border-line bg-card px-4 pb-5 pt-2 shadow-lg">
            <ul className="grid">
              {links.map(([href, label]) => (
                <li key={href}>
                  <a href={href} onClick={(e) => go(e, href)} className="block border-b border-line/70 py-3.5 text-lg font-medium">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-3">
              <a href={join.href} onClick={(e) => go(e, join.href)} className="btn-primary flex-1 justify-center text-center">
                {join.label}
              </a>
              <a href={switchLang.href} hrefLang={switchLang.hrefLang} className="btn-ghost">
                {switchLang.label}
              </a>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
