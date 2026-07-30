"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Bell,
  CalendarClock,
  Check,
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
  overdue: { icon: CircleAlert, className: "bg-[#fff0ed] text-[#c65c4d]" },
  due_soon: { icon: IndianRupee, className: "bg-[#fff4e8] text-[#b66a45]" },
  lease: { icon: CalendarClock, className: "bg-[#eef0ff] text-[#5555c7]" },
  rent_increase: { icon: TrendingUp, className: "bg-[#e8f5ef] text-[#328161]" },
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
  onNavigate: (section: "Payments" | "Tenants") => void;
}) {
  const [open, setOpen] = useState(false);
  const [optimisticReadIds, setOptimisticReadIds] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const notifications = initialNotifications.map((item) =>
    optimisticReadIds.includes(item.id) ? { ...item, read: true } : item,
  );
  const unread = notifications.filter((item) => !item.read);

  useEffect(() => {
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
  }, []);

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
    onNavigate(item.section);
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
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#ed7864] ring-2 ring-white" />
            <span className="sr-only">{unread.length} unread notifications</span>
          </>
        )}
      </Button>

      {open && (
        <section
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-50 w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#e5e7ef] bg-white shadow-[0_22px_70px_rgba(34,38,56,.18)]"
        >
          <div className="flex items-center justify-between border-b border-[#eff0f4] px-4 py-3.5">
            <div>
              <h2 className="text-sm font-extrabold text-[#292f3d]">Notifications</h2>
              <p className="mt-0.5 text-[11px] text-[#9298a7]">
                {unread.length ? `${unread.length} unread` : "You're all caught up"}
              </p>
            </div>
            {unread.length > 0 && (
              <button
                type="button"
                disabled={pending}
                onClick={() => persistRead(unread.map((item) => item.id))}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold text-[#5555c7] hover:bg-[#f1f1fd] disabled:opacity-50"
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
                      "flex w-full gap-3 border-b border-[#f0f1f5] px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-[#fafafd]",
                      !item.read && "bg-[#f8f8ff]",
                    )}
                  >
                    <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl", style.className)}>
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-2">
                        <span className="flex-1 text-xs font-bold text-[#353b4a]">{item.title}</span>
                        {!item.read && <span className="mt-1 size-2 shrink-0 rounded-full bg-[#6363d7]" />}
                      </span>
                      <span className="mt-1 block text-[11px] leading-[1.55] text-[#767d8e]">
                        {item.description}
                      </span>
                      <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#a0a5b2]">
                        {formatDate.format(new Date(`${item.date}T12:00:00+05:30`))}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-10 text-center">
              <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-[#f1f2f7] text-[#8c92a2]">
                <Bell className="size-5" />
              </span>
              <p className="mt-3 text-sm font-bold text-[#404655]">No notifications</p>
              <p className="mt-1 text-xs leading-5 text-[#8c92a2]">
                Upcoming dues, lease dates, and rent increases will appear here.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
