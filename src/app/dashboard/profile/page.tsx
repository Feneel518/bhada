import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { landlord } from "@/db/schema";
import { auth } from "@/lib/auth";
import { Dashboard } from "@/components/dashboard";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in?returnTo=/dashboard/profile");
  }

  const [profile] = await db
    .select()
    .from(landlord)
    .where(eq(landlord.userId, session.user.id))
    .limit(1);

  return (
    <Dashboard
      initialSection="Profile"
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
      profile={{
        businessName: profile?.businessName ?? session.user.name,
        phone: profile?.phone ?? "",
        gstin: profile?.gstin ?? "",
        pan: profile?.pan ?? "",
        address: profile?.address ?? "",
        city: profile?.city ?? "",
        state: profile?.state ?? "",
        pincode: profile?.pincode ?? "",
      }}
    />
  );
}
