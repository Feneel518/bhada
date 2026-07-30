import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const OWNER_EMAIL = "feneelp@gmail.com";

export function isOwnerEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() === OWNER_EMAIL;
}

export const requireOwner = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in?returnTo=/owner");
  }

  if (!isOwnerEmail(session.user.email)) {
    notFound();
  }

  return session.user;
});
