import { LandingPage } from "@/components/landing/landing-page";
import { landingCopy } from "@/lib/landing-copy";
import { landingMetadata } from "@/lib/landing-metadata";

export const metadata = landingMetadata("gu");

export default function GujaratiHome() {
  return <LandingPage copy={landingCopy.gu} locale="gu" />;
}
