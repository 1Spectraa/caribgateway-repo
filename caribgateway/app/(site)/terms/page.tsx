import type { Metadata } from "next";
import LegalPage from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — CaribGateway",
  description: "The terms that apply when you use CaribGateway.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="These terms apply when you use CaribGateway, including the blog, the Contact page and the business listings."
      updated="October 9, 2026"
      sections={[
        {
          heading: "Using CaribGateway",
          body: [
            "CaribGateway is a directory of destinations and businesses in the Caribbean. You can use it to find places, read about them and contact them.",
            "If you have been given access to a listing, you may manage that listing in line with these terms.",
          ],
        },
        {
          heading: "Listings",
          body: [
            "Businesses are responsible for keeping their details accurate, including prices, opening times, services and contact details.",
            "We check new listings before they go live. We may change, switch off or remove a listing that breaks these terms or that we believe is misleading.",
          ],
        },
        {
          heading: "Accounts",
          body: [
            "Keep your sign-in details private. You are responsible for what happens under your account.",
            "Tell us straight away if you think someone else has used your account.",
          ],
        },
        {
          heading: "Your content",
          body: [
            "Do not post anything that is unlawful, misleading or abusive, or that infringes someone else's rights. We may remove content that breaks these rules.",
          ],
        },
        {
          heading: "Information on the site",
          body: [
            "We do our best to keep information accurate, but it is provided as it is. Check the details with the business before you travel or pay.",
          ],
        },
        {
          heading: "Changes",
          body: ["We may update these terms. The date at the top shows when they last changed."],
        },
      ]}
    />
  );
}
