"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const KEY = "agyal-theme";

/** Runs at the start of <body> before paint so a saved theme never flashes the wrong colours. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export function nextTheme(current: Theme): Theme {
  return current === "dark" ? "light" : "dark";
}

/** The look on screen now: a saved choice, otherwise the device setting. */
function shownTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  if (t === "light" || t === "dark") return t;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** One click switches between light and dark, and remembers the choice on this device. Until then the site follows the device. */
export function ThemeToggle({ labels }: { labels: { toDark: string; toLight: string } }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(shownTheme());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const follow = () => setTheme(shownTheme());
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);

  const toggle = () => {
    const next = nextTheme(shownTheme());
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // private mode or storage blocked: the choice lasts for this page only
    }
  };

  const label = theme === "dark" ? labels.toLight : labels.toDark;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      data-theme-shown={theme ?? undefined}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink/80 ring-1 ring-line transition hover:bg-ink/5 hover:text-ink"
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {theme === "dark" ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        )}
      </svg>
    </button>
  );
}
