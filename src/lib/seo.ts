import type { Metadata } from "next";

export const SITE_NAME = "Bhada";
export const SITE_ALTERNATE_NAME = "Bhadaa";
// Vercel currently redirects the apex domain to this host. Keep every canonical,
// sitemap URL, and structured-data identifier on the final (200) URL.
export const SITE_URL = "https://www.bhadaa.in";
export const SITE_DESCRIPTION =
  "Rent tracking and management software for landlords in India. Track rent payments, dues, tenants, GST and TDS-ready bills, electricity, reminders, and PDF bills.";

export const SEO_KEYWORDS = [
  "rent tracking",
  "rent tracker",
  "rent tracking app",
  "rent tracking software",
  "rent tracker for landlords",
  "rent management software",
  "rent collection tracker",
  "tenant rent tracker",
  "landlord software India",
  "rental property management software India",
  "rent billing software",
  "Bhada",
  "Bhadaa",
  "Bhadaa rent tracker",
];

export const PRIVATE_PAGE_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};
