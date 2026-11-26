import type { Metadata } from "next";
import { landingCopy, landingPaths, type LandingLocale } from "@/lib/landing-copy";
import { SEO_KEYWORDS, SITE_NAME } from "@/lib/seo";

const localizedKeywords: Record<LandingLocale, string[]> = {
  en: SEO_KEYWORDS,
  hi: ["किराया प्रबंधन", "किराया ऐप", "मकान मालिक ऐप", "किराया रसीद", "किरायेदार", "Bhadaa", ...SEO_KEYWORDS.slice(0, 6)],
  gu: ["ભાડા મેનેજમેન્ટ", "ભાડા એપ", "મકાન માલિક", "ભાડાની રસીદ", "ભાડુઆત", "Bhadaa", ...SEO_KEYWORDS.slice(0, 6)],
};

export function landingMetadata(locale: LandingLocale): Metadata {
  const copy = landingCopy[locale];
  const title = `${SITE_NAME} — ${copy.meta.title}`;
  return {
    title: { absolute: title },
    description: copy.meta.description,
    keywords: localizedKeywords[locale],
    alternates: {
      canonical: landingPaths[locale],
      languages: {
        "en-IN": landingPaths.en,
        "hi-IN": landingPaths.hi,
        "gu-IN": landingPaths.gu,
        "x-default": landingPaths.en,
      },
    },
    openGraph: {
      title,
      description: copy.meta.description,
      url: landingPaths[locale],
      type: "website",
      locale: copy.htmlLang.replace("-", "_"),
    },
    twitter: { card: "summary_large_image", title, description: copy.meta.description },
  };
}
