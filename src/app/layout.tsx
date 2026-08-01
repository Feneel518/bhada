import type { Metadata, Viewport } from "next";
import { DM_Sans, Gotu } from "next/font/google";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/components/language-provider";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Bhada — Rent Management Software for Landlords",
    template: "%s | Bhada",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Property management software",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: SITE_NAME,
    title: "Bhada — Rent Management Software for Landlords",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Bhada — Rent Management Software for Landlords",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111111",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <LanguageProvider>
          {children}
          <Toaster
            className="bhada-toaster"
            position="top-right"
            closeButton
            gap={10}
            offset={{ top: 20, right: 20 }}
            mobileOffset={16}
            toastOptions={{ duration: 4500 }}
          />
        </LanguageProvider>
      </body>
    </html>
  );
}
