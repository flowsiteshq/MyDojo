/**
 * Social Post Scheduler Job
 *
 * Runs every 5 minutes to publish any scheduled posts whose scheduledFor
 * time has passed. Updates the post status to 'published' or 'failed'.
 */
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { postToFacebook, postToInstagram } from "./socialMedia";

export async function runSocialPostJob(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date();

  // Find all scheduled posts whose time has come
  const duePosts = await db
    .select()
    .from(schema.socialPosts)
    .where(
      and(
        eq(schema.socialPosts.status, "scheduled"),
        lte(schema.socialPosts.scheduledFor, now)
      )
    );

  if (duePosts.length === 0) return;

  console.log(`[SocialPostJob] Found ${duePosts.length} post(s) to publish.`);

  for (const post of duePosts) {
    let facebookPostId: string | null = null;
    let instagramPostId: string | null = null;
    let errorMessage: string | null = null;

    try {
      // Publish to Facebook
      if (post.platforms === "facebook" || post.platforms === "both") {
        facebookPostId = await postToFacebook(post.message, post.imageUrl ?? undefined);
        console.log(`[SocialPostJob] Published to Facebook: ${facebookPostId}`);
      }

      // Publish to Instagram (requires image)
      if ((post.platforms === "instagram" || post.platforms === "both") && post.imageUrl) {
        instagramPostId = await postToInstagram(post.message, post.imageUrl);
        console.log(`[SocialPostJob] Published to Instagram: ${instagramPostId}`);
      }

      await db
        .update(schema.socialPosts)
        .set({
          status: "published",
          publishedAt: now,
          facebookPostId: facebookPostId ?? undefined,
          instagramPostId: instagramPostId ?? undefined,
          errorMessage: null,
        })
        .where(eq(schema.socialPosts.id, post.id));

    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[SocialPostJob] Failed to publish post ${post.id}: ${errorMessage}`);
      await db
        .update(schema.socialPosts)
        .set({ status: "failed", errorMessage })
        .where(eq(schema.socialPosts.id, post.id));
    }
  }

  console.log(`[SocialPostJob] Job complete.`);
}
