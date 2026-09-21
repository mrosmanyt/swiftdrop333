"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "swiftdrop-install-dismissed-at";
const DISMISS_DAYS = 14;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari's own flag for "launched from home screen".
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function wasDismissedRecently() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const days = (Date.now() - Number(raw)) / (1000 * 60 * 60 * 24);
    return days < DISMISS_DAYS;
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // localStorage can throw in private browsing — the prompt just won't
    // remember the dismissal for this visitor, which is a harmless fallback.
  }
}

/**
 * Site-wide "install SwiftDrop as an app" prompt — shown to everyone
 * (customers browsing the marketing site, merchants, drivers, admin), since
 * every one of them benefits from a home-screen icon instead of hunting for
 * a browser tab. Registers the service worker (required for installability
 * on Android/desktop Chrome), then listens for the browser's own
 * `beforeinstallprompt` event and surfaces it as a small bottom banner
 * instead of leaving it to fire silently. iOS Safari never fires that
 * event — there's no programmatic install API — so iOS visitors instead
 * get a short "Add to Home Screen" instruction banner.
 */
export default function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failing (e.g. unsupported browser) just means no
        // install prompt / offline shell — the site still works normally.
      });
    }

    if (isStandalone() || wasDismissedRecently()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS/iPadOS Safari (and any browser without beforeinstallprompt
    // support) never fires that event, so detect it directly and show the
    // manual instructions instead, after giving the page a moment to settle.
    const ua = window.navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && "ontouchend" in document);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    if (isIos && isSafari) {
      const t = setTimeout(() => {
        setShowIosHint(true);
        setVisible(true);
      }, 2500);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (!visible) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  function handleDismiss() {
    dismiss();
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm sm:px-0 sm:pb-0">
      <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-lg">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-bright to-accent">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path d="M3 13.5 10.5 6l4 4L21 3.5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="10.5" cy="6" r="1.6" fill="white" />
            <path d="M4 20h16" stroke="white" strokeWidth="2.4" strokeLinecap="round" opacity="0.45" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">Install the SwiftDrop app</p>
          {showIosHint ? (
            <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
              Tap <span className="font-medium text-fg">Share</span>{" "}
              <span aria-hidden="true">⬆️</span> then{" "}
              <span className="font-medium text-fg">Add to Home Screen</span>.
            </p>
          ) : (
            <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
              Faster access, works like a native app — for tracking orders, managing deliveries, or driving.
            </p>
          )}
          <div className="mt-2.5 flex items-center gap-2">
            {!showIosHint && (
              <button
                onClick={handleInstall}
                className="rounded-lg bg-accent-solid px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
              >
                Install
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="rounded-lg border border-line px-3 py-1.5 text-xs text-fg-muted hover:bg-fg/5"
            >
              {showIosHint ? "Got it" : "Not now"}
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-lg p-1 text-fg-subtle hover:bg-fg/5"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
