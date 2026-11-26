"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Keeps the tenant page current: refreshes every minute while visible and
// whenever the tenant comes back to the tab (e.g. after paying in a UPI app).
export function LiveRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") router.refresh(); };
    const timer = window.setInterval(refresh, seconds * 1000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router, seconds]);
  return null;
}
