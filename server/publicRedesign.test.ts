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

  it("keeps the public header as a single cohesive navigation layer", () => {
    const layout = readFileSync(new URL("../client/src/components/Layout.tsx", import.meta.url), "utf8");

    expect(layout).toContain('Utility links are retained in the mobile menu and footer');
    expect(layout).not.toContain('md:top-[calc(32px+var(--cookie-banner-height,0px))]');
  });

  it("uses a static MyDojo training image rather than video playback in the homepage hero", () => {
    const home = readPage("Home.tsx");

    expect(home).toContain("mydojo-hero-uniforms-corrected_0496fac3.png");
    expect(home).not.toContain("hero_montage_v5_d1227c92.mp4");
    expect(home).not.toContain("<video");
  });

  it("keeps the desktop menu expanded across the screen rather than inside a narrow container", () => {
    const layout = readFileSync(new URL("../client/src/components/Layout.tsx", import.meta.url), "utf8");

    expect(layout).toContain("w-full items-center justify-between gap-5 px-5 sm:px-8 lg:px-10 xl:px-14 2xl:px-20");
    expect(layout).toContain("flex-1 items-center justify-end gap-6 lg:gap-8 xl:gap-10");
  });
});
