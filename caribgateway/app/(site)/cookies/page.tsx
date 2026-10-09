import type { Metadata } from "next";
import LegalPage from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy — CaribGateway",
  description: "Which cookies CaribGateway uses, and why.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Cookie Policy"
      intro="This page explains which cookies CaribGateway uses, and why."
      updated="October 9, 2026"
      sections={[
        {
          heading: "What cookies are",
          body: [
            "Cookies are small files that a website stores in your browser. They help a site remember things between visits.",
          ],
        },
        {
          heading: "The cookies we use",
          body: [
            "A sign-in cookie, which keeps you signed in. It is only sent to CaribGateway.",
            "A display cookie, which tells the site your name and which parts of the site you can use, so the right links appear.",
          ],
        },
        {
          heading: "Other websites",
          body: ["We do not use cookies to follow you around the web."],
        },
        {
          heading: "Managing cookies",
          body: [
            "You can block or delete cookies in your browser settings. If you do, you may need to sign in again.",
          ],
        },
      ]}
    />
  );
}
