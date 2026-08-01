import type { Metadata } from "next";
import { PRIVATE_PAGE_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Choose a new password",
  ...PRIVATE_PAGE_METADATA,
};

export default function ResetPasswordLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
