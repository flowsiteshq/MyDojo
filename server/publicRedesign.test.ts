import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readPage = (name: string) =>
  readFileSync(new URL(`../client/src/pages/${name}`, import.meta.url), "utf8");

describe("public-site redesign", () => {
  it("keeps a usable free-class conversion path on every redesigned marketing page", () => {
    for (const page of ["Home.tsx", "Programs.tsx", "KidsMartialArts.tsx", "AdultKickboxing.tsx", "About.tsx"]) {
      const source = readPage(page);
      expect(source).toContain("openBookFreeClassGate");
      expect(source).toContain("Book");
    }
  });

  it("uses the shared public design system for the redesigned core pages", () => {
    for (const page of ["Home.tsx", "Programs.tsx", "KidsMartialArts.tsx", "AdultKickboxing.tsx", "About.tsx", "Locations.tsx", "Shop.tsx", "Schedule.tsx", "Contact.tsx", "Events.tsx"]) {
      expect(readPage(page)).toContain("public-page");
    }
  });

  it("keeps responsive and mobile-specific layout treatment on the public homepage", () => {
    const home = readPage("Home.tsx");

    expect(home).toContain("md:");
    expect(home).toContain("MobileCta");
    expect(home).toContain("md:hidden");
  });

  it("keeps location discovery and shop checkout integrations wired after styling changes", () => {
    expect(readPage("Locations.tsx")).toContain("MapView");
    expect(readPage("Shop.tsx")).toContain("ShopCheckoutModal");
    expect(readPage("Shop.tsx")).toContain("openCheckout");
    expect(readPage("Schedule.tsx")).toContain("openBookFreeClassGate");
  });

  it("submits contact requests through the established tracked lead confirmation workflow", () => {
    const contact = readPage("Contact.tsx");

    expect(contact).toContain("trpc.trialSignups.create.useMutation");
    expect(contact).toContain('source: "website"');
    expect(contact).toContain("confirmationSms.sent");
  });

  it("does not introduce fabricated customer testimonial content into the redesigned pages", () => {
    const source = ["Home.tsx", "KidsMartialArts.tsx", "AdultKickboxing.tsx", "About.tsx"]
      .map(readPage)
      .join("\n");

    expect(source).not.toContain("Jessica M.");
    expect(source).not.toContain("David K.");
    expect(source).not.toContain("J. Thompson");
  });

  it("keeps the student dashboard mobile navigation focused on five member essentials", () => {
    const dashboard = readPage("MemberDashboard2.tsx");

    for (const label of ["Home", "Benefits", "Locate", "Shop", "Account"]) {
      expect(dashboard).toContain(`label: "${label}"`);
    }
    expect(dashboard).toContain('href: "/locations"');
    expect(dashboard).toContain('href: "/shop"');
  });
});
