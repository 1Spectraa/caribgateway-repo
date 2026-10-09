import type { Metadata } from "next";
import LegalPage from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — CaribGateway",
  description: "What information CaribGateway collects, why, and what we do with it.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This page explains what CaribGateway collects, why we collect it, and what we do with it."
      updated="October 9, 2026"
      sections={[
        {
          heading: "Information you give us",
          body: [
            "If you create an account, we keep the name and email address you give us so you can sign in.",
            "If you send us a message from the Contact page, we keep your name, your email address and the message, so we can reply and follow up.",
          ],
        },
        {
          heading: "Listing statistics",
          body: [
            "We count how often each listing is viewed, and how often visitors tap its phone, email, website, directions or social links. The counts are kept as totals for each day and each listing.",
            "These counts do not identify the people who viewed a listing or tapped a link.",
          ],
        },
        {
          heading: "How we use your information",
          body: [
            "We use it to run your account, reply to your messages, publish and maintain listings, show businesses how visitors find them, and keep the site working and secure.",
          ],
        },
        {
          heading: "Sharing",
          body: [
            "We do not sell your personal information. We share it only with the companies that run the site for us, or when the law requires it.",
          ],
        },
        {
          heading: "Cookies",
          body: ["We use cookies to keep you signed in. The Cookie Policy explains which ones, and why."],
        },
        {
          heading: "Your choices",
          body: [
            "You can ask us to correct or delete your account or your messages at any time. Contact us and we will take it from there.",
          ],
        },
      ]}
    />
  );
}
