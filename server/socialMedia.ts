/**
 * Social Media Publishing Helper
 *
 * Handles posting to Facebook Pages and Instagram Business accounts
 * using the Facebook Graph API v18.0.
 *
 * Required env vars:
 *   FACEBOOK_PAGE_ACCESS_TOKEN  — Page Access Token (long-lived)
 *   FACEBOOK_PAGE_ID            — Numeric Facebook Page ID
 *   INSTAGRAM_BUSINESS_ACCOUNT_ID — Instagram Business Account ID (optional)
 */

const GRAPH_API = "https://graph.facebook.com/v18.0";

function getPageToken(): string {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("FACEBOOK_PAGE_ACCESS_TOKEN is not set");
  return token;
}

function getPageId(): string {
  const id = process.env.FACEBOOK_PAGE_ID;
  if (!id) throw new Error("FACEBOOK_PAGE_ID is not set");
  return id;
}

function getIgAccountId(): string | null {
  return process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ?? null;
}

/** Post a text-only or link post to the Facebook Page */
export async function postToFacebook(message: string, imageUrl?: string): Promise<string> {
  const pageId = getPageId();
  const token = getPageToken();

  let endpoint: string;
  let body: Record<string, string>;

  if (imageUrl) {
    // Photo post
    endpoint = `${GRAPH_API}/${pageId}/photos`;
    body = {
      message,
      url: imageUrl,
      access_token: token,
    };
  } else {
    // Text/link post
    endpoint = `${GRAPH_API}/${pageId}/feed`;
    body = {
      message,
      access_token: token,
    };
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json() as { id?: string; error?: { message: string } };
  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? `Facebook API error: ${res.status}`);
  }
  return data.id!;
}

/** Post to Instagram Business Account (requires image) */
export async function postToInstagram(message: string, imageUrl: string): Promise<string> {
  const igAccountId = getIgAccountId();
  if (!igAccountId) throw new Error("INSTAGRAM_BUSINESS_ACCOUNT_ID is not set");
  const token = getPageToken();

  // Step 1: Create media container
  const containerRes = await fetch(`${GRAPH_API}/${igAccountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      caption: message,
      access_token: token,
    }),
  });
  const containerData = await containerRes.json() as { id?: string; error?: { message: string } };
  if (!containerRes.ok || containerData.error) {
    throw new Error(containerData.error?.message ?? `Instagram container error: ${containerRes.status}`);
  }

  // Step 2: Publish the container
  const publishRes = await fetch(`${GRAPH_API}/${igAccountId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: containerData.id,
      access_token: token,
    }),
  });
  const publishData = await publishRes.json() as { id?: string; error?: { message: string } };
  if (!publishRes.ok || publishData.error) {
    throw new Error(publishData.error?.message ?? `Instagram publish error: ${publishRes.status}`);
  }
  return publishData.id!;
}

/** Fetch engagement stats for a Facebook post */
export async function getFacebookPostStats(postId: string): Promise<{ likes: number; comments: number; shares: number }> {
  const token = getPageToken();
  const res = await fetch(
    `${GRAPH_API}/${postId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${token}`
  );
  const data = await res.json() as {
    likes?: { summary?: { total_count?: number } };
    comments?: { summary?: { total_count?: number } };
    shares?: { count?: number };
    error?: { message: string };
  };
  if (!res.ok || data.error) return { likes: 0, comments: 0, shares: 0 };
  return {
    likes: data.likes?.summary?.total_count ?? 0,
    comments: data.comments?.summary?.total_count ?? 0,
    shares: data.shares?.count ?? 0,
  };
}

/** Check if Facebook credentials are configured */
export function isFacebookConfigured(): boolean {
  return !!(process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID);
}

/** Check if Instagram credentials are configured */
export function isInstagramConfigured(): boolean {
  return !!(process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID);
}
