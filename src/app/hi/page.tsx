import { LandingPage } from "@/components/landing/landing-page";
import { landingCopy } from "@/lib/landing-copy";
import { landingMetadata } from "@/lib/landing-metadata";

export const metadata = landingMetadata("hi");

export default function HindiHome() {
  return <LandingPage copy={landingCopy.hi} locale="hi" />;
}
