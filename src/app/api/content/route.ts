import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { createClient } from "@supabase/supabase-js";
import { sendJournalEmail } from "@/lib/email";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").trim().toLowerCase();

type ContentType = "projects" | "blogs" | "settings" | "journals";

function getFirebaseAdmin() {
  if (!admin.apps.length) {
    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!rawServiceAccount) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is missing.");
    }

    try {
      let cleanJson = rawServiceAccount.trim();
      if (cleanJson.startsWith("'") && cleanJson.endsWith("'")) cleanJson = cleanJson.slice(1, -1);
      if (cleanJson.startsWith('"') && cleanJson.endsWith('"')) cleanJson = cleanJson.slice(1, -1);

      let serviceAccount = JSON.parse(cleanJson);
      if (typeof serviceAccount === "string") {
        serviceAccount = JSON.parse(serviceAccount);
      }
      
      if (serviceAccount.private_key && typeof serviceAccount.private_key === "string") {
        let key = serviceAccount.private_key;
        
        // Normalize newlines: Convert literal "\\n" to actual newlines
        key = key.replace(/\\n/g, "\n");
        
        // Only wrap in headers if they are completely missing.
        // We check for "-----BEGIN" to avoid double-wrapping "RSA PRIVATE KEY" vs "PRIVATE KEY".
        if (!key.includes("-----BEGIN")) {
           key = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;
        }
        
        serviceAccount.private_key = key.trim() + "\n";
      }

      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } catch (err) {
      console.error("Firebase Initialization Error:", err);
      throw new Error(`Failed to initialize Firebase Admin: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return admin;
}

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Supabase service credentials are missing.");
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

function getSupabaseReader() {
  const key = SUPABASE_SERVICE_KEY || SUPABASE_PUBLIC_KEY;

  if (!SUPABASE_URL || !key) {
    throw new Error("Supabase credentials are missing.");
  }

  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false },
  });
}

function getSupabaseWriter() {
  if (SUPABASE_SERVICE_KEY) return getSupabaseAdmin();
  if (process.env.NODE_ENV !== "production") return getSupabaseReader();

  throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
}

function canVerifyFirebaseToken() {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT);
}

async function requireAdmin(request: Request) {
  // If we're in development and Firebase is being difficult, allow the write to proceed
  if (process.env.NODE_ENV === "development") {
    return null;
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  try {
    const adminApp = getFirebaseAdmin();
    const decoded = await adminApp.auth().verifyIdToken(token);
    
    if (ADMIN_EMAIL && decoded.email?.trim().toLowerCase() !== ADMIN_EMAIL) {
      console.warn(`Access denied for ${decoded.email}. Admin email is ${ADMIN_EMAIL}.`);
      return NextResponse.json({ error: "Forbidden: You are not an admin." }, { status: 403 });
    }
  } catch (err: any) {
    console.error("Firebase Verification Error:", err);
    return NextResponse.json({ 
      error: "Authentication failed", 
      message: err.message,
      code: err.code 
    }, { status: 401 });
  }

  return null;
}

function tableFor(type: ContentType) {
  if (type === "projects") return "projects";
  if (type === "blogs") return "blogs";
  if (type === "journals") return "journals";
  return "settings";
}

function isMissingTableError(error: { code?: string; message?: string }) {
  return error.code === "42P01" || error.message?.includes("Could not find the table");
}

function isRlsError(error: { code?: string; message?: string }) {
  return error.code === "42501" || error.message?.includes("row-level security");
}

function missingSchemaResponse() {
  return NextResponse.json(
    { error: "Supabase tables are missing. Run sql/supabase_schema.sql in the Supabase SQL editor." },
    { status: 500 },
  );
}

function rlsResponse() {
  return NextResponse.json(
    {
      error:
        "Supabase RLS is blocking writes. Add SUPABASE_SERVICE_ROLE_KEY to .env.local, or disable RLS for these tables while developing.",
    },
    { status: 500 },
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as ContentType | null;

    if (type !== "projects" && type !== "blogs" && type !== "settings" && type !== "journals") {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }

    const supabase = getSupabaseReader();

    if (type === "settings") {
      const key = searchParams.get("key");
      if (!key) return NextResponse.json({ error: "Missing setting key" }, { status: 400 });

      const { data, error } = await supabase.from(tableFor(type)).select("value").eq("key", key).maybeSingle();
      if (error && isMissingTableError(error)) return NextResponse.json({ data: null });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: data?.value ?? null });
    }

    const orderColumn = type === "journals" ? "date" : "created_at";
    const { data, error } = await supabase.from(tableFor(type)).select("*").order(orderColumn, { ascending: false });
    if (error && isMissingTableError(error)) return NextResponse.json({ data: [] });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const type = body.type as ContentType | "seed";
    const supabase = getSupabaseWriter();

    if (type === "projects") {
      const { error } = await supabase.from("projects").insert([
        {
          title: body.project?.title,
          description: body.project?.description,
          tech: body.project?.tech ?? [],
          link: body.project?.link ?? "#",
          image_url: body.project?.imageUrl ?? "",
          featured: Boolean(body.project?.featured),
        },
      ]);

      if (error && isMissingTableError(error)) return missingSchemaResponse();
      if (error && isRlsError(error)) return rlsResponse();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (type === "blogs") {
      const { error } = await supabase.from("blogs").insert([
        {
          title: body.blog?.title,
          slug: body.blog?.slug,
          excerpt: body.blog?.excerpt,
          content: body.blog?.content,
          date: body.blog?.date,
          read_time: body.blog?.readTime ?? "5 min read",
        },
      ]);

      if (error && isMissingTableError(error)) return missingSchemaResponse();
      if (error && isRlsError(error)) return rlsResponse();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (type === "settings") {
      const { key, value } = body;
      if (!key) return NextResponse.json({ error: "Missing setting key" }, { status: 400 });

      const { error } = await supabase.from("settings").upsert({ key, value }, { onConflict: "key" });
      if (error && isMissingTableError(error)) return missingSchemaResponse();
      if (error && isRlsError(error)) return rlsResponse();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (type === "journals") {
      const { error } = await supabase.from("journals").upsert(
        [
          {
            date: body.journal?.date,
            data: body.journal?.data ?? {},
          },
        ],
        { onConflict: "date" },
      );

      if (error && isMissingTableError(error)) return missingSchemaResponse();
      if (error && isRlsError(error)) return rlsResponse();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Send email update
      if (body.journal?.date && body.journal?.data) {
        try {
          sendJournalEmail(body.journal.date, body.journal.data).catch(console.error);
        } catch (emailErr) {
          console.error("Email trigger failed:", emailErr);
        }
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { type, id } = await request.json();

    if ((type !== "projects" && type !== "blogs" && type !== "journals") || !id) {
      return NextResponse.json({ error: "Invalid delete request" }, { status: 400 });
    }

    const { error } = await getSupabaseWriter().from(tableFor(type)).delete().eq("id", id);
    if (error && isMissingTableError(error)) return missingSchemaResponse();
    if (error && isRlsError(error)) return rlsResponse();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
