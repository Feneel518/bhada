"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function RefreshAnalyticsButton() {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="grid size-9 place-items-center rounded-lg border border-[#dfe1e8] bg-white text-[#6f7482] transition hover:border-[#c9c8eb] hover:text-[#5b56c7] disabled:cursor-wait disabled:opacity-70"
      aria-label={isRefreshing ? "Refreshing analytics" : "Refresh analytics"}
      title="Refresh analytics"
      disabled={isRefreshing}
      onClick={() => startTransition(() => router.refresh())}
    >
      <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
    </button>
  );
}
