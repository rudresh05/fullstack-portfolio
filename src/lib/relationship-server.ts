import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { supabaseAdmin } from "@/lib/supabase";
import type { RelationshipOverview } from "@/lib/relationship-types";

const COOKIE_NAME = "relationship_access";
const SESSION_SECRET = process.env.RELATIONSHIP_SESSION_SECRET ?? "";
const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").trim().toLowerCase();

type Session = { relationshipId: string; expiresAt: number };

function sign(value: string) {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

export function createRelationshipSession(relationshipId: string, expiresAt: Date) {
  if (!SESSION_SECRET) throw new Error("RELATIONSHIP_SESSION_SECRET is missing.");
  const encoded = Buffer.from(JSON.stringify({ relationshipId, expiresAt: expiresAt.getTime() })).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export async function getRelationshipSession(): Promise<Session | null> {
  if (!SESSION_SECRET) return null;
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return null;
  const [encoded, receivedSignature] = value.split(".");
  if (!encoded || !receivedSignature) return null;
  const expectedSignature = sign(encoded);
  if (receivedSignature.length !== expectedSignature.length || !timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature))) return null;
  try {
    const session = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Session;
    return typeof session.relationshipId === "string" && Number.isFinite(session.expiresAt) && session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export async function requireAdmin(request: Request) {
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Missing administrator token.");
  const decoded = await getFirebaseAdmin().auth().verifyIdToken(token);
  if (ADMIN_EMAIL && decoded.email?.trim().toLowerCase() !== ADMIN_EMAIL) throw new Error("Forbidden.");
  return decoded.uid;
}

const mapRows = (rows: Array<Record<string, unknown>> | null) => rows ?? [];

export async function getRelationshipOverview(relationshipId: string): Promise<RelationshipOverview | null> {
  const [
    relationshipResult,
    settingsResult,
    timelineResult,
    memoriesResult,
    lettersResult,
    questionsResult,
    bucketResult,
    placesResult,
    mediaAssetsResult,
  ] = await Promise.all([
    supabaseAdmin.from("relationships").select("id, slug, recipient_name").eq("id", relationshipId).eq("status", "published").maybeSingle(),
    supabaseAdmin.from("relationship_settings").select("hero_title, hero_subtitle, story_heading, story_body, portrait_path").eq("relationship_id", relationshipId).maybeSingle(),
    supabaseAdmin.from("timeline_events").select("id, title, body, occurred_on, location_name, cover_asset:media_assets(storage_path)").eq("relationship_id", relationshipId).eq("is_published", true).order("occurred_on").order("sort_order"),
    supabaseAdmin.from("memories").select("id, title, caption, narrative, occurred_on, location_name, mood, tags, memory_media(alt_text, sort_order, media_asset:media_assets(id, storage_path, media_type))").eq("relationship_id", relationshipId).eq("is_published", true).order("occurred_on", { ascending: false }).order("sort_order"),
    supabaseAdmin.from("letters").select("id, title, body, signature, access_rule, unlock_at").eq("relationship_id", relationshipId).eq("is_published", true).order("sort_order"),
    supabaseAdmin.from("questions").select("id, prompt, helper_text, response_type, is_required").eq("relationship_id", relationshipId).eq("is_active", true).order("sort_order"),
    supabaseAdmin.from("bucket_list_items").select("id, title, description, category, status").eq("relationship_id", relationshipId).order("sort_order"),
    supabaseAdmin.from("future_places").select("id, name, story, is_visited").eq("relationship_id", relationshipId).order("sort_order"),
    supabaseAdmin.from("media_assets").select("id, storage_path, media_type").eq("relationship_id", relationshipId).order("created_at", { ascending: false }),
  ]);

  if (relationshipResult.error || !relationshipResult.data) return null;

  // Collect all storage paths that need signed URLs
  const paths: string[] = [];
  if (settingsResult.data?.portrait_path) {
    paths.push(settingsResult.data.portrait_path);
  }

  const timelineRows = mapRows(timelineResult.data);
  timelineRows.forEach((row) => {
    const asset = row.cover_asset as { storage_path: string } | null;
    if (asset?.storage_path) {
      paths.push(asset.storage_path);
    }
  });

  const memoriesRows = mapRows(memoriesResult.data);
  memoriesRows.forEach((row) => {
    const mediaList = (row.memory_media || []) as any[];
    mediaList.forEach((mm) => {
      const asset = mm.media_asset;
      if (asset?.storage_path) {
        paths.push(asset.storage_path);
      }
    });
  });

  const mediaAssetRows = mapRows(mediaAssetsResult.data);
  mediaAssetRows.forEach((row) => {
    if (typeof row.storage_path === "string" && row.storage_path) {
      paths.push(row.storage_path);
    }
  });

  // Batch generate signed URLs
  const urlMap = new Map<string, string>();
  if (paths.length > 0) {
    const uniquePaths = Array.from(new Set(paths));
    const { data: signedUrls } = await supabaseAdmin.storage
      .from("relationship-media")
      .createSignedUrls(uniquePaths, 3600); // 1 hour expiration

    if (signedUrls) {
      signedUrls.forEach((item: any) => {
        if (item.path && item.signedUrl) {
          urlMap.set(item.path, item.signedUrl);
        }
      });
    }

    // Also fallback to public URL if signed URL wasn't returned
    uniquePaths.forEach((p) => {
      if (!urlMap.has(p)) {
        if (p.startsWith("http://") || p.startsWith("https://") || p.startsWith("/")) {
          urlMap.set(p, p);
        } else {
          const pub = supabaseAdmin.storage.from("relationship-media").getPublicUrl(p).data?.publicUrl;
          if (pub) urlMap.set(p, pub);
        }
      }
    });
  }

  // Resolve portrait URL (with intelligent fallbacks if portrait_path was not set)
  let resolvedPortraitUrl: string | null = null;
  if (settingsResult.data?.portrait_path) {
    resolvedPortraitUrl = urlMap.get(settingsResult.data.portrait_path) ?? null;
  }
  
  // If no explicit portrait set, use the latest uploaded image asset as portrait
  if (!resolvedPortraitUrl && mediaAssetRows.length > 0) {
    const firstImg = mediaAssetRows.find((a) => String(a.media_type) === "image" || String(a.storage_path).match(/\.(jpg|jpeg|png|webp|gif)$/i));
    if (firstImg && typeof firstImg.storage_path === "string") {
      resolvedPortraitUrl = urlMap.get(firstImg.storage_path) ?? null;
    }
  }

  const now = Date.now();
  return {
    relationship: { id: relationshipResult.data.id, slug: relationshipResult.data.slug, recipientName: relationshipResult.data.recipient_name },
    settings: {
      heroTitle: settingsResult.data?.hero_title ?? "",
      heroSubtitle: settingsResult.data?.hero_subtitle ?? "",
      storyHeading: settingsResult.data?.story_heading ?? "",
      storyBody: settingsResult.data?.story_body ?? "",
      portraitUrl: resolvedPortraitUrl,
    },
    timeline: timelineRows.map((row) => {
      const asset = row.cover_asset as { storage_path: string } | null;
      const cPath = asset?.storage_path;
      return {
        id: String(row.id),
        title: String(row.title),
        body: String(row.body),
        occurredOn: row.occurred_on ? String(row.occurred_on) : null,
        locationName: row.location_name ? String(row.location_name) : null,
        coverUrl: cPath ? (urlMap.get(cPath) ?? null) : null,
      };
    }),
    memories: memoriesRows.map((row) => {
      const mediaList = (row.memory_media || []) as any[];
      const media = mediaList
        .map((mm) => {
          const asset = mm.media_asset;
          if (!asset) return null;
          const sPath = String(asset.storage_path || "");
          return {
            id: String(asset.id),
            url: sPath ? (urlMap.get(sPath) ?? "") : "",
            mediaType: (asset.media_type || "image") as "image" | "video" | "audio",
            altText: String(mm.alt_text || ""),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null && item.url !== "");

      return {
        id: String(row.id),
        title: String(row.title),
        caption: String(row.caption),
        narrative: String(row.narrative),
        occurredOn: row.occurred_on ? String(row.occurred_on) : null,
        locationName: row.location_name ? String(row.location_name) : null,
        mood: row.mood ? String(row.mood) : null,
        tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
        media,
      };
    }),
    letters: mapRows(lettersResult.data).map((row) => {
      const unlocked = row.access_rule === "shared" || (row.access_rule === "scheduled" && row.unlock_at && new Date(String(row.unlock_at)).getTime() <= now);
      return {
        id: String(row.id),
        title: String(row.title),
        body: unlocked ? String(row.body) : null,
        signature: unlocked ? String(row.signature) : "",
        accessRule: String(row.access_rule),
        unlockAt: row.unlock_at ? String(row.unlock_at) : null,
        isUnlocked: Boolean(unlocked),
      };
    }),
    questions: mapRows(questionsResult.data).map((row) => ({
      id: String(row.id),
      prompt: String(row.prompt),
      helperText: row.helper_text ? String(row.helper_text) : null,
      responseType: row.response_type === "short_text" ? "short_text" : "long_text",
      isRequired: Boolean(row.is_required),
    })),
    bucketList: mapRows(bucketResult.data).map((row) => ({
      id: String(row.id),
      title: String(row.title),
      description: String(row.description),
      category: String(row.category),
      status: row.status as "planned" | "in_progress" | "complete",
    })),
    places: mapRows(placesResult.data).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      story: String(row.story),
      isVisited: Boolean(row.is_visited),
    })),
  };
}

export function hashPasscode(passcode: string): string {
  if (!SESSION_SECRET) throw new Error("RELATIONSHIP_SESSION_SECRET is missing.");
  return createHmac("sha256", SESSION_SECRET).update(passcode).digest("hex");
}

export { COOKIE_NAME };
