import type { Metadata } from "next";
import { DM_Sans, Gotu } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Gotu({
  variable: "--font-display",
  subsets: ["devanagari", "latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Bhada — Rent, without the runaround",
    template: "%s | Bhada",
  },
  description: "A calm, modern rent tracking workspace for independent landlords.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
