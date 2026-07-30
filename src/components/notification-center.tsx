"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Bell,
  CalendarClock,
  Check,
  CircleCheck,
  CircleAlert,
  IndianRupee,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { markNotificationsRead } from "@/app/dashboard/notifications/actions";
import { Button } from "@/components/ui/button";
import type { NotificationItem, NotificationKind } from "@/lib/notifications";
import { cn } from "@/lib/utils";

const kindStyles: Record<NotificationKind, { icon: typeof Bell; className: string }> = {
  payment: { icon: CircleCheck, className: "border-[#7aa18b]/25 bg-[#7aa18b]/10 text-[#9bc4ab]" },
  overdue: { icon: CircleAlert, className: "border-[#c96a4e]/25 bg-[#c96a4e]/10 text-[#df8a70]" },
  due_soon: { icon: IndianRupee, className: "border-[#dda676]/25 bg-[#dda676]/10 text-[#dda676]" },
  lease: { icon: CalendarClock, className: "border-[#e4c77a]/25 bg-[#e4c77a]/10 text-[#e4c77a]" },
  rent_increase: { icon: TrendingUp, className: "border-[#7aa18b]/25 bg-[#7aa18b]/10 text-[#9bc4ab]" },
};

const formatDate = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
});

export function NotificationCenter({
  initialNotifications,
  onNavigate,
}: {
  initialNotifications: NotificationItem[];
  onNavigate: (notification: NotificationItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [optimisticReadIds, setOptimisticReadIds] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const notifications = useMemo(() => {
    const readIds = new Set(optimisticReadIds);
    return initialNotifications.map((item) =>
      readIds.has(item.id) ? { ...item, read: true } : item,
    );
  }, [initialNotifications, optimisticReadIds]);
  const unread = notifications.filter((item) => !item.read);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function persistRead(keys: string[]) {
    if (!keys.length) return;
    setOptimisticReadIds((current) =>
      [...new Set([...current, ...keys])],
    );
    startTransition(async () => {
      const result = await markNotificationsRead(keys);
      if (!result.ok) {
        setOptimisticReadIds((current) =>
          current.filter((id) => !keys.includes(id)),
        );
        toast.error(result.message);
      }
    });
  }

  function openNotification(item: NotificationItem) {
    if (!item.read) persistRead([item.id]);
    onNavigate(item);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="outline"
        size="icon"
        className="relative"
        aria-label={
          unread.length
            ? `Notifications, ${unread.length} unread`
            : "Notifications, none unread"
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="size-[18px]" />
        {unread.length > 0 && (
          <>
            <span className="absolute right-1.5 top-1.5 size-2 bg-[#ed7864] ring-2 ring-[#111111]" />
            <span className="sr-only">{unread.length} unread notifications</span>
          </>
        )}
      </Button>

      {open && (
        <section
          role="dialog"
          aria-label="Notifications"
          className="bhada-popover-surface absolute right-0 top-12 z-50 w-[min(390px,calc(100vw-2rem))] overflow-hidden border border-white/10 bg-[#171717] shadow-[0_22px_60px_rgba(0,0,0,.42)]"
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3.5">
            <div>
              <h2 className="text-sm font-extrabold text-[#edede8]">Notifications</h2>
              <p className="mt-0.5 text-[11px] text-white/35">
                {unread.length ? `${unread.length} unread` : "You're all caught up"}
              </p>
            </div>
            {unread.length > 0 && (
              <button
                type="button"
                disabled={pending}
                onClick={() => persistRead(unread.map((item) => item.id))}
                className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-[#e4c77a] hover:bg-[#e4c77a]/10 disabled:opacity-50"
              >
                <Check className="size-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {notifications.length ? (
            <div className="max-h-[min(520px,70vh)] overflow-y-auto">
              {notifications.map((item) => {
                const style = kindStyles[item.kind];
                const Icon = style.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openNotification(item)}
                    className={cn(
                      "flex w-full gap-3 border-b border-white/[0.07] px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-white/[0.035]",
                      !item.read && "bg-[#e4c77a]/[0.035]",
                    )}
                  >
                    <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center border", style.className)}>
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-2">
                        <span className="flex-1 text-xs font-bold text-[#edede8]">{item.title}</span>
                        {!item.read && <span className="mt-1 size-2 shrink-0 bg-[#e4c77a]" />}
                      </span>
                      <span className="mt-1 block text-[11px] leading-[1.55] text-white/45">
                        {item.description}
                      </span>
                      <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">
                        {formatDate.format(new Date(`${item.date}T12:00:00+05:30`))}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-10 text-center">
              <span className="mx-auto grid size-11 place-items-center border border-white/10 bg-white/[0.035] text-white/40">
                <Bell className="size-5" />
              </span>
              <p className="mt-3 text-sm font-bold text-[#edede8]">No notifications</p>
              <p className="mt-1 text-xs leading-5 text-white/40">
                Payments, upcoming dues, lease dates, and rent increases will appear here.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
