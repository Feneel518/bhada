import type { Metadata } from "next";
import { PRIVATE_PAGE_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Sign in or create an account",
  ...PRIVATE_PAGE_METADATA,
};

export default function SignInLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
