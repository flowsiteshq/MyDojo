import "dotenv/config";
import express from "express";
import compression from "compression";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startDojoFlowSyncJob } from "../dojoFlowSyncJob";
import { runIntroReminderJob } from "../introReminderJob";
import { runGHLSyncJob } from "../ghlSyncJob";
import { runNoShowFollowUpJob } from "../noShowFollowUpJob";
import { runStudentReminderJob } from "../studentReminderJob";
import { runSocialPostJob } from "../socialPostJob";
import { runDeferredTuitionJob } from "../deferredTuitionJob";
import { startDailyClassRosterJob } from "../dailyClassRosterJob";
import { handleStripeWebhook } from "../stripeWebhook";
import { handleGHLWebhook } from "../ghlWebhook";
import { handleFacebookWebhook, verifyFacebookWebhook } from "../facebookWebhook";
import { handleFluidPayWebhook } from "../fluidpayWebhook";
import { handleSitemap } from "../sitemap";
import { handleSyncExport } from "../syncExport";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Redirect non-www to www (canonical URL) to avoid duplicate content and reduce redirects
  // Also enforce HTTPS in production
  app.use((req, res, next) => {
    const host = req.headers.host || "";
    const proto = req.headers["x-forwarded-proto"] || req.protocol;
    
    // Redirect http -> https in production
    if (process.env.NODE_ENV === "production" && proto === "http") {
      return res.redirect(301, `https://${host}${req.originalUrl}`);
    }
    
    // Redirect mydojoma.com -> www.mydojoma.com (canonical)
    if (host === "mydojoma.com") {
      return res.redirect(301, `https://www.mydojoma.com${req.originalUrl}`);
    }
    
    next();
  });

  // Enable gzip compression for all responses (reduces JS/CSS/HTML by ~60-80%)
  app.use(compression({
    level: 6, // good balance of speed vs compression ratio
    threshold: 1024, // only compress responses > 1KB
    filter: (req, res) => {
      // Don't compress Stripe webhook (needs raw body)
      if (req.path === '/api/stripe/webhook') return false;
      return compression.filter(req, res);
    }
  }));

  // Stripe webhook endpoint - MUST be before body parser middleware
  // Stripe requires raw body for signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
  );

  // GoHighLevel webhook endpoint - receives lead/contact events from GHL
  // Needs its own json() parser because it's registered before the global express.json() middleware
  app.post("/api/ghl/webhook", express.json({ limit: "1mb" }), handleGHLWebhook);

  // Facebook Lead Ads webhook endpoint
  // GET: verification handshake from Facebook
  // POST: lead event delivery
  app.get("/api/facebook/webhook", verifyFacebookWebhook);
  app.post("/api/facebook/webhook", express.json({ limit: "1mb" }), handleFacebookWebhook);

  // Fluid Pay webhook endpoint - receives subscription renewal and payment failure events
  // Must use raw body parser so we can verify the HMAC-SHA256 Signature header
  app.post(
    "/api/fluidpay/webhook",
    express.raw({ type: "application/json" }),
    handleFluidPayWebhook
  );

  // Dynamic XML sitemap — served before Vite/static middleware so it takes priority
  app.get("/sitemap.xml", handleSitemap);

  // Secure sync-export endpoint — returns all intro appointments and students as JSON
  // Protected by SYNC_EXPORT_API_KEY (Authorization: Bearer <key> or ?api_key=<key>)
  app.get("/api/sync-export", handleSyncExport);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Storage proxy for uploaded assets
  registerStorageProxy(app);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Start background job for DojoFlow sync retry
    // Runs every 5 minutes to retry failed syncs
    startDojoFlowSyncJob(5);

    // Start intro reminder SMS job — runs every 30 minutes
    // Texts leads whose intro class is ~24 hours away
    runIntroReminderJob().catch(console.error); // run once at startup
    setInterval(() => {
      runIntroReminderJob().catch(console.error);
    }, 30 * 60 * 1000); // every 30 minutes
    console.log("[IntroReminder] Scheduled to run every 30 minutes.");

    // Start GHL contact sync job — runs every 30 minutes
    // Pulls new contacts from GHL API and imports them as leads
    runGHLSyncJob().catch(console.error); // run once at startup
    setInterval(() => {
      runGHLSyncJob().catch(console.error);
    }, 30 * 60 * 1000); // every 30 minutes
    console.log("[GHLSync] Scheduled to run every 30 minutes.");

    // Start no-show follow-up SMS job — runs every 30 minutes
    // Texts leads whose intro class passed but they didn't show up
    runNoShowFollowUpJob().catch(console.error); // run once at startup
    setInterval(() => {
      runNoShowFollowUpJob().catch(console.error);
    }, 30 * 60 * 1000); // every 30 minutes
    console.log("[NoShowFollowUp] Scheduled to run every 30 minutes.");

    // Start student appointment 2-hour reminder SMS job — runs every 15 minutes
    // Texts enrolled students whose class is ~2 hours away
    runStudentReminderJob().catch(console.error); // run once at startup
    setInterval(() => {
      runStudentReminderJob().catch(console.error);
    }, 15 * 60 * 1000); // every 15 minutes
    console.log("[StudentReminder] Scheduled to run every 15 minutes.");

    // Start social post scheduler job — runs every 5 minutes
    // Publishes scheduled social media posts when their time arrives
    runSocialPostJob().catch(console.error); // run once at startup
    setInterval(() => {
      runSocialPostJob().catch(console.error);
    }, 5 * 60 * 1000); // every 5 minutes
    console.log("[SocialPostJob] Scheduled to run every 5 minutes.");

    // Start deferred tuition auto-charge job — runs every 30 minutes
    // Charges first-month tuition for enrollments where the deferred date has arrived
    runDeferredTuitionJob().catch(console.error); // run once at startup
    setInterval(() => {
      runDeferredTuitionJob().catch(console.error);
    }, 30 * 60 * 1000); // every 30 minutes
    console.log("[DeferredTuitionJob] Scheduled to run every 30 minutes.");

    // Start daily class roster SMS job — sends at 7:00 AM CDT every day
    // Texts all admin/staff with the day's class sign-up roster
    startDailyClassRosterJob();
    console.log("[DailyRoster] Scheduled to send at 7:00 AM CDT daily.");
  });
}

startServer().catch(console.error);
