import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: "2026-08-01",
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/rent-management-software`,
      lastModified: "2026-08-01",
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];
}
