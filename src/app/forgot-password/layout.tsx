import type { Metadata } from "next";
import { PRIVATE_PAGE_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Reset your password",
  ...PRIVATE_PAGE_METADATA,
};

export default function ForgotPasswordLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
