import { Helmet } from "react-helmet-async";

interface StructuredDataProps {
  type?: "LocalBusiness" | "Article" | "Organization";
  data?: any;
}

export function StructuredData({ type = "LocalBusiness", data }: StructuredDataProps) {
  const getStructuredData = () => {
    if (data) return data;

    // Default Local Business structured data for MyDojo
    if (type === "LocalBusiness") {
      return {
        "@context": "https://schema.org",
        "@type": "SportsActivityLocation",
        "name": "MyDojo Martial Arts & Fitness",
        "image": "https://mydojoma.manus.space/images/hero-main.jpg",
        "description": "Premier martial arts training facility in Tomball, Texas. Offering programs for all ages including Little Ninjas (3-5), Dragon Kids (5-12), Teens (12-17), and Adults (18+). Specializing in karate, kickboxing, and self-defense training.",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Tomball",
          "addressLocality": "Tomball",
          "addressRegion": "TX",
          "postalCode": "77375",
          "addressCountry": "US"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 30.0933,
          "longitude": -95.6160
        },
        "url": "https://mydojoma.manus.space",
        "telephone": "(877) 4-MYDOJO",
        "priceRange": "$$",
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "opens": "09:00",
            "closes": "21:00"
          },
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": "Saturday",
            "opens": "09:00",
            "closes": "14:00"
          }
        ],
        "sameAs": [
          "https://www.facebook.com/mydojo",
          "https://www.instagram.com/mydojo",
          "https://www.tiktok.com/@mydojo",
          "https://www.youtube.com/@mydojo"
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "reviewCount": "150"
        },
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Martial Arts Programs",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Little Ninjas Program",
                "description": "Martial arts program for children ages 3-5"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Dragon Kids Program",
                "description": "Martial arts program for children ages 5-12"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Teen Program",
                "description": "Martial arts program for teens ages 12-17"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Adult Program",
                "description": "Martial arts and kickboxing for adults 18+"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "After School Program",
                "description": "After school care with martial arts training"
              }
            }
          ]
        }
      };
    }

    return null;
  };

  const structuredData = getStructuredData();

  if (!structuredData) return null;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
