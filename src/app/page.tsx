import { LandingPage } from "@/components/landing/landing-page";
import { landingCopy } from "@/lib/landing-copy";
import { landingMetadata } from "@/lib/landing-metadata";

export const metadata = landingMetadata("en");

export default function Home() {
  return <LandingPage copy={landingCopy.en} locale="en" />;
}
