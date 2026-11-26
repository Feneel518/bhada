import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = { "en-IN": SITE_URL, "hi-IN": `${SITE_URL}/hi`, "gu-IN": `${SITE_URL}/gu` };
  return [
    {
      url: SITE_URL,
      lastModified: "2026-11-26",
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages },
    },
    {
      url: `${SITE_URL}/hi`,
      lastModified: "2026-11-26",
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: { languages },
    },
    {
      url: `${SITE_URL}/gu`,
      lastModified: "2026-11-26",
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: { languages },
    },
    {
      url: `${SITE_URL}/rent-management-software`,
      lastModified: "2026-08-03",
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/rent-tracking`,
      lastModified: "2026-08-03",
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];
}
