"use client";

import Link from "next/link";
import Script from "next/script";
import { useSyncExternalStore } from "react";
import { Button } from "./ui";

const KEY = "quranova-cookie-consent";
type Choice = "accepted" | "declined" | null;

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const read = (): Choice => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "accepted" || v === "declined" ? v : null;
  } catch {
    return null;
  }
};
function write(choice: Exclude<Choice, null>) {
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    /* storage blocked: choice only lasts for this page view */
  }
  listeners.forEach((l) => l());
}

/**
 * Cookie banner. Analytics scripts only load after the visitor accepts, so
 * nothing is tracked by default. Set NEXT_PUBLIC_GA_ID to enable Google Analytics.
 */
export function CookieConsent() {
  // Server snapshot is "declined" so nothing renders or loads before hydration.
  const choice = useSyncExternalStore(subscribe, read, () => "declined" as Choice);
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <>
      {choice === "accepted" && gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="lazyOnload" />
          <Script id="ga-init" strategy="lazyOnload">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      )}

      {choice === null && (
        <div
          role="dialog"
          aria-label="Cookie preferences"
          className="sheet-in fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border border-brand-100 bg-white p-4 shadow-xl sm:bottom-5 sm:p-5"
        >
          <p className="text-sm text-ink">
            We use optional analytics cookies to understand how the site is used. Nothing is tracked unless you accept.
            See our{" "}
            <Link href="/privacy-policy" className="font-medium text-brand-600 underline">
              privacy policy
            </Link>
            .
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="primary" onClick={() => write("accepted")}>
              Accept
            </Button>
            <Button variant="outline" onClick={() => write("declined")}>
              Decline
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
