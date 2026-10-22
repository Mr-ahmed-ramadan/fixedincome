"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Marks the page as JS-enabled and fades sections in as they scroll into view.
 * Without JS (or with reduced motion) everything is simply visible. Runs again
 * on every route change and picks up sections added later, so a page reached
 * by client-side navigation never stays hidden.
 */
export function RevealRoot() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("js");
    const showAll = () => document.querySelectorAll<HTMLElement>("[data-reveal]:not(.in)").forEach((el) => el.classList.add("in"));
    // Arriving at an anchor (e.g. "#yields"): show everything so the jump lands on content.
    if (!("IntersectionObserver" in window) || window.location.hash) {
      showAll();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const watch = () =>
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.in):not([data-watched])").forEach((el) => {
        el.dataset.watched = "";
        // Anything already on screen shows immediately.
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in");
        else io.observe(el);
      });
    watch();
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });
    // In-page anchor jumps skip past sections; reveal them all.
    window.addEventListener("hashchange", showAll);
    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("hashchange", showAll);
      document.querySelectorAll<HTMLElement>("[data-watched]").forEach((el) => delete el.dataset.watched);
    };
  }, [pathname]);
  return null;
}
