import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { COOKIE_NAME, createRelationshipSession } from "@/lib/relationship-server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token || token.length > 512) return NextResponse.json({ error: "Invalid access link." }, { status: 400 });
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await supabaseAdmin.from("relationship_access_links").select("relationship_id, expires_at, revoked_at").eq("token_hash", tokenHash).maybeSingle();
  if (error || !data || data.revoked_at || (data.expires_at && new Date(data.expires_at).getTime() <= Date.now())) return NextResponse.json({ error: "This access link is no longer available." }, { status: 401 });
  const expiresAt = data.expires_at ? new Date(data.expires_at) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, createRelationshipSession(data.relationship_id, expiresAt), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt });
  await supabaseAdmin.from("relationship_access_links").update({ last_used_at: new Date().toISOString() }).eq("token_hash", tokenHash);
  return response;
}
