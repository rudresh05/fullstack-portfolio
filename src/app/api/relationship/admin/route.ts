import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/relationship-server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const ownerId = await requireAdmin(request);
    
    // Fetch relationship and settings
    const { data: relationship, error: relErr } = await supabaseAdmin
      .from("relationships")
      .select("id, slug, recipient_name, status, created_at")
      .eq("owner_firebase_uid", ownerId)
      .maybeSingle();
      
    if (relErr) {
      return NextResponse.json({ error: relErr.message }, { status: 500 });
    }
    
    if (!relationship) {
      return NextResponse.json({ relationship: null });
    }
    
    // Fetch access links
    const { data: links, error: linkErr } = await supabaseAdmin
      .from("relationship_access_links")
      .select("id, label, expires_at, revoked_at, last_used_at, created_at")
      .eq("relationship_id", relationship.id)
      .order("created_at", { ascending: false });
      
    if (linkErr) {
      return NextResponse.json({ error: linkErr.message }, { status: 500 });
    }
    
    return NextResponse.json({
      relationship,
      accessLinks: links || []
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unauthorized." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const ownerId = await requireAdmin(request);
    
    // Find relationship
    const { data: relationship, error: relErr } = await supabaseAdmin
      .from("relationships")
      .select("id")
      .eq("owner_firebase_uid", ownerId)
      .maybeSingle();
      
    if (relErr || !relationship) {
      return NextResponse.json({ error: "Relationship space not found." }, { status: 404 });
    }
    
    const body = await request.json().catch(() => ({}));
    const label = typeof body.label === "string" ? body.label.trim().slice(0, 100) : "Recipient link";
    
    // Generate new high-entropy token
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    
    const { error: insertErr } = await supabaseAdmin
      .from("relationship_access_links")
      .insert({
        relationship_id: relationship.id,
        token_hash: tokenHash,
        label,
        expires_at: body.expiresAt ? new Date(body.expiresAt).toISOString() : null
      });
      
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
    
    return NextResponse.json({
      ok: true,
      accessUrl: `/me/unlock?token=${encodeURIComponent(token)}`
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unauthorized." }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  try {
    const ownerId = await requireAdmin(request);
    
    // Find relationship
    const { data: relationship } = await supabaseAdmin
      .from("relationships")
      .select("id")
      .eq("owner_firebase_uid", ownerId)
      .maybeSingle();
      
    if (!relationship) {
      return NextResponse.json({ error: "Relationship space not found." }, { status: 404 });
    }
    
    const body = await request.json().catch(() => ({}));
    const linkId = typeof body.id === "string" ? body.id : "";
    
    if (!linkId) {
      return NextResponse.json({ error: "Link ID is required." }, { status: 400 });
    }
    
    // Revoke link by setting revoked_at
    const { error } = await supabaseAdmin
      .from("relationship_access_links")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", linkId)
      .eq("relationship_id", relationship.id);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unauthorized." }, { status: 401 });
  }
}
