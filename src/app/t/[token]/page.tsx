import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveRefresh } from "@/components/tenant-portal/live-refresh";
import { TenantPortalView } from "@/components/tenant-portal/tenant-portal-view";
import { getTenantPortal } from "@/lib/tenant-portal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your rent",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function TenantPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const portal = await getTenantPortal(token);
  if (!portal) notFound();
  return (
    <>
      <LiveRefresh />
      <TenantPortalView portal={portal} />
    </>
  );
}
