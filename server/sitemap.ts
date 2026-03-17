import { Request, Response } from "express";

const CANONICAL_DOMAIN = "https://www.mydojoma.com";

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: string;
}

function toDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function handleSitemap(_req: Request, res: Response) {
  const today = toDate(new Date());
  // Schema markup was added on 2026-03-08; use that as baseline for enriched pages
  const schemaDate = "2026-03-08";

  const urls: SitemapUrl[] = [
    // Homepage — highest priority, updated frequently
    { loc: "/", lastmod: today, changefreq: "weekly", priority: "1.0" },

    // Core marketing pages
    { loc: "/programs", lastmod: schemaDate, changefreq: "weekly", priority: "0.9" },
    { loc: "/schedule", lastmod: schemaDate, changefreq: "daily", priority: "0.9" },

    // Individual program pages — schema-enriched Course pages
    { loc: "/programs/little-ninjas", lastmod: schemaDate, changefreq: "monthly", priority: "0.85" },
    { loc: "/programs/dragon-kids", lastmod: schemaDate, changefreq: "monthly", priority: "0.85" },
    { loc: "/programs/teens", lastmod: schemaDate, changefreq: "monthly", priority: "0.85" },
    { loc: "/programs/adult-karate", lastmod: schemaDate, changefreq: "monthly", priority: "0.85" },
    { loc: "/programs/kickboxing", lastmod: schemaDate, changefreq: "monthly", priority: "0.85" },
    { loc: "/programs/after-school", lastmod: schemaDate, changefreq: "monthly", priority: "0.80" },
    { loc: "/programs/summer-camp", lastmod: schemaDate, changefreq: "monthly", priority: "0.75" },

    // Location pages
    { loc: "/locations", lastmod: schemaDate, changefreq: "monthly", priority: "0.80" },
    { loc: "/locations/hq", lastmod: schemaDate, changefreq: "monthly", priority: "0.80" },

    // Events
    { loc: "/events", lastmod: today, changefreq: "weekly", priority: "0.80" },

    // About & Contact — LocalBusiness schema pages
    { loc: "/about", lastmod: schemaDate, changefreq: "monthly", priority: "0.75" },
    { loc: "/contact", lastmod: schemaDate, changefreq: "monthly", priority: "0.75" },

    // Testimonials & Blog
    { loc: "/testimonials", lastmod: today, changefreq: "monthly", priority: "0.70" },
    { loc: "/blog", lastmod: today, changefreq: "weekly", priority: "0.70" },

    // Careers
    { loc: "/careers", lastmod: schemaDate, changefreq: "monthly", priority: "0.60" },

    // Legal
    { loc: "/privacy-policy", lastmod: "2026-01-01", changefreq: "yearly", priority: "0.30" },
    { loc: "/terms-of-service", lastmod: "2026-01-01", changefreq: "yearly", priority: "0.30" },
  ];

  const urlEntries = urls
    .map(
      (u) => `  <url>
    <loc>${CANONICAL_DOMAIN}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
    http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  // Cache for 1 hour in CDN, 5 minutes in browser
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600");
  res.status(200).send(xml);
}
