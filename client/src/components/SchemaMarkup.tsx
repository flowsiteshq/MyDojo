/**
 * SchemaMarkup — Injects JSON-LD structured data into page <head> via react-helmet-async.
 *
 * Supported schema types:
 *  - LocalBusiness / SportsActivityLocation  (homepage, location pages)
 *  - FAQPage                                 (homepage FAQ section)
 *  - Course                                  (program pages)
 *  - Event                                   (schedule / class pages)
 *  - BreadcrumbList                          (all inner pages)
 *  - WebSite                                 (homepage — enables sitelinks search box)
 */

import { Helmet } from "react-helmet-async";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LocalBusinessSchemaProps {
  type: "LocalBusiness";
}

export interface FAQSchemaProps {
  type: "FAQPage";
  faqs: { question: string; answer: string }[];
}

export interface CourseSchemaProps {
  type: "Course";
  name: string;
  description: string;
  url: string;
  provider?: string;
  ageRange?: string;
  courseMode?: string;
}

export interface EventSchemaProps {
  type: "Event";
  name: string;
  description: string;
  startDate: string; // ISO 8601
  endDate?: string;
  location?: string;
  url?: string;
  isRecurring?: boolean;
}

export interface BreadcrumbSchemaProps {
  type: "BreadcrumbList";
  items: { name: string; url: string }[];
}

export interface WebSiteSchemaProps {
  type: "WebSite";
}

export type SchemaMarkupProps =
  | LocalBusinessSchemaProps
  | FAQSchemaProps
  | CourseSchemaProps
  | EventSchemaProps
  | BreadcrumbSchemaProps
  | WebSiteSchemaProps;

// ─── Constants ────────────────────────────────────────────────────────────────

const SITE_URL = "https://www.mydojoma.com";
const BUSINESS_NAME = "MyDojo Martial Arts & Fitness";
const PHONE = "+18774693656"; // (877) 4-MYDOJO
const ADDRESS = {
  streetAddress: "11721 Spring Cypress Rd",
  addressLocality: "Tomball",
  addressRegion: "TX",
  postalCode: "77377",
  addressCountry: "US",
};
const GEO = { latitude: 30.0112706, longitude: -95.6025971 };
const LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/qYVQxVSfHBmyqxTB.jpg";
const HOURS = [
  "Mo,Tu,We,Th 12:00-21:00",
  "Fr 12:00-20:00",
  "Sa 09:00-14:00",
];

// ─── Schema builders ──────────────────────────────────────────────────────────

function buildLocalBusiness() {
  return {
    "@context": "https://schema.org",
    "@type": ["SportsActivityLocation", "LocalBusiness"],
    "@id": `${SITE_URL}/#organization`,
    name: BUSINESS_NAME,
    alternateName: "MyDojo",
    url: SITE_URL,
    logo: LOGO,
    image: [
      LOGO,
      "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/QCDmgxbjdlfUOCPT.jpg",
    ],
    description:
      "Premier martial arts training in Tomball, Texas. Programs for all ages: Little Ninjas (ages 3-5), Dragon Kids (ages 5-12), Teens, Adults, and Fitness Kickboxing. Expert instructors, proven results. Start your free trial today!",
    telephone: PHONE,
    priceRange: "$$",
    currenciesAccepted: "USD",
    paymentAccepted: "Cash, Credit Card",
    address: {
      "@type": "PostalAddress",
      ...ADDRESS,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: GEO.latitude,
      longitude: GEO.longitude,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
        opens: "12:00",
        closes: "21:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Friday"],
        opens: "12:00",
        closes: "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday"],
        opens: "09:00",
        closes: "14:00",
      },
    ],
    hasMap: `https://www.google.com/maps/search/?api=1&query=${GEO.latitude},${GEO.longitude}`,
    sameAs: [
      "https://www.facebook.com/mydojoma",
      "https://www.instagram.com/mydojoma",
      "https://www.yelp.com/biz/mydojo-martial-arts-tomball",
    ],
    areaServed: [
      { "@type": "City", name: "Tomball", containedIn: { "@type": "State", name: "Texas" } },
      { "@type": "City", name: "Spring", containedIn: { "@type": "State", name: "Texas" } },
      { "@type": "City", name: "Cypress", containedIn: { "@type": "State", name: "Texas" } },
      { "@type": "City", name: "Klein", containedIn: { "@type": "State", name: "Texas" } },
      { "@type": "City", name: "The Woodlands", containedIn: { "@type": "State", name: "Texas" } },
    ],
    knowsAbout: [
      "Karate",
      "Kickboxing",
      "Martial Arts",
      "Self Defense",
      "Children's Martial Arts",
      "Adult Fitness",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Martial Arts Programs",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Course",
            name: "Little Ninjas",
            description: "Martial arts for ages 3-5 focusing on listening skills, balance, and coordination.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Course",
            name: "Dragon Kids",
            description: "Martial arts for ages 5-12 building confidence, discipline, and self-defense skills.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Course",
            name: "Teens & Adults Martial Arts",
            description: "Traditional martial arts combined with modern self-defense for teens and adults.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Course",
            name: "Fitness Kickboxing",
            description: "High-energy kickboxing classes burning 800+ calories per session.",
          },
        },
      ],
    },
  };
}

function buildFAQPage(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

function buildCourse(props: CourseSchemaProps) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: props.name,
    description: props.description,
    url: props.url,
    provider: {
      "@type": "Organization",
      name: props.provider ?? BUSINESS_NAME,
      sameAs: SITE_URL,
    },
    courseMode: props.courseMode ?? "onsite",
    typicalAgeRange: props.ageRange,
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/join`,
      priceCurrency: "USD",
      description: "Free trial class available. Contact us for membership pricing.",
    },
  };
}

function buildEvent(props: EventSchemaProps) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: props.name,
    description: props.description,
    startDate: props.startDate,
    endDate: props.endDate ?? props.startDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: props.location ?? BUSINESS_NAME,
      address: {
        "@type": "PostalAddress",
        ...ADDRESS,
      },
    },
    organizer: {
      "@type": "Organization",
      name: BUSINESS_NAME,
      url: SITE_URL,
    },
    url: props.url ?? SITE_URL,
    isAccessibleForFree: false,
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/join`,
      priceCurrency: "USD",
    },
  };
}

function buildBreadcrumb(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

function buildWebSite() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: BUSINESS_NAME,
    url: SITE_URL,
    description:
      "Premier martial arts training in Tomball, Texas. Programs for all ages.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: BUSINESS_NAME,
      logo: {
        "@type": "ImageObject",
        url: LOGO,
      },
    },
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SchemaMarkup(props: SchemaMarkupProps) {
  let schema: object;

  switch (props.type) {
    case "LocalBusiness":
      schema = buildLocalBusiness();
      break;
    case "FAQPage":
      schema = buildFAQPage(props.faqs);
      break;
    case "Course":
      schema = buildCourse(props);
      break;
    case "Event":
      schema = buildEvent(props);
      break;
    case "BreadcrumbList":
      schema = buildBreadcrumb(props.items);
      break;
    case "WebSite":
      schema = buildWebSite();
      break;
    default:
      return null;
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema, null, 0)}
      </script>
    </Helmet>
  );
}
