import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startDojoFlowSyncJob } from "../dojoFlowSyncJob";
import { runIntroReminderJob } from "../introReminderJob";
import { runGHLSyncJob } from "../ghlSyncJob";
import { runNoShowFollowUpJob } from "../noShowFollowUpJob";
import { handleStripeWebhook } from "../stripeWebhook";
import { handleGHLWebhook } from "../ghlWebhook";
import { handleFacebookWebhook, verifyFacebookWebhook } from "../facebookWebhook";
import { handleFluidPayWebhook } from "../fluidpayWebhook";
import { handleSitemap } from "../sitemap";

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
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
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
  });
}

startServer().catch(console.error);
