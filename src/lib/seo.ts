import type { Metadata } from "next";

export const SITE_NAME = "Bhada";
// Vercel currently redirects the apex domain to this host. Keep every canonical,
// sitemap URL, and structured-data identifier on the final (200) URL.
export const SITE_URL = "https://www.bhadaa.in";
export const SITE_DESCRIPTION =
  "Rent management software for independent landlords in India. Track rent, GST and TDS-ready bills, submeter electricity, payments, reminders, and PDF bills.";

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
