import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getRelationshipOverview, getRelationshipSession, requireAdmin } from "@/lib/relationship-server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getRelationshipSession();
  if (!session) return NextResponse.json({ error: "Relationship access is required." }, { status: 401 });
  const data = await getRelationshipOverview(session.relationshipId);
  if (!data) return NextResponse.json({ error: "This relationship is not available." }, { status: 404 });
  return NextResponse.json({ data }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (body.action === "bootstrap") {
    try {
      if (!process.env.RELATIONSHIP_SESSION_SECRET) return NextResponse.json({ error: "RELATIONSHIP_SESSION_SECRET must be configured before creating a private space." }, { status: 500 });
      const ownerId = await requireAdmin(request);
      const recipientName = typeof body.recipientName === "string" ? body.recipientName.trim().slice(0, 100) : "";
      const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "";
      const heroTitle = typeof body.heroTitle === "string" ? body.heroTitle.trim().slice(0, 180) : "";
      if (!recipientName || !slug || !heroTitle) return NextResponse.json({ error: "Recipient name, page name, and hero title are required." }, { status: 400 });
      const { data: existing } = await supabaseAdmin.from("relationships").select("id").eq("owner_firebase_uid", ownerId).maybeSingle();
      if (existing) return NextResponse.json({ error: "A relationship space already exists for this account." }, { status: 409 });
      const { data: relationship, error } = await supabaseAdmin.from("relationships").insert({ owner_firebase_uid: ownerId, slug, recipient_name: recipientName, status: "published" }).select("id").single();
      if (error || !relationship) return NextResponse.json({ error: error?.message ?? "Unable to create the relationship space." }, { status: 500 });
      await supabaseAdmin.from("relationship_settings").insert({ relationship_id: relationship.id, hero_title: heroTitle, hero_subtitle: typeof body.heroSubtitle === "string" ? body.heroSubtitle.trim().slice(0, 300) : "", story_heading: typeof body.storyHeading === "string" ? body.storyHeading.trim().slice(0, 180) : "", story_body: typeof body.storyBody === "string" ? body.storyBody.trim().slice(0, 5000) : "" });
      const token = randomBytes(32).toString("base64url");
      await supabaseAdmin.from("relationship_access_links").insert({ relationship_id: relationship.id, token_hash: createHash("sha256").update(token).digest("hex"), label: "First private link" });
      return NextResponse.json({ ok: true, accessUrl: `/me/unlock?token=${encodeURIComponent(token)}` }, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized." }, { status: 401 });
    }
  }
  const session = await getRelationshipSession();
  if (!session) return NextResponse.json({ error: "Relationship access is required." }, { status: 401 });
  const questionId = typeof body.questionId === "string" ? body.questionId : "";
  const response = typeof body.response === "string" ? body.response.trim() : "";
  const respondentLabel = typeof body.respondentLabel === "string" ? body.respondentLabel.trim().slice(0, 80) : null;
  if (!questionId || !response || response.length > 5000) return NextResponse.json({ error: "Please provide an answer of up to 5,000 characters." }, { status: 400 });
  const { data: question } = await supabaseAdmin.from("questions").select("id").eq("id", questionId).eq("relationship_id", session.relationshipId).eq("is_active", true).maybeSingle();
  if (!question) return NextResponse.json({ error: "Question not found." }, { status: 404 });
  const { error } = await supabaseAdmin.from("question_answers").insert({ question_id: questionId, relationship_id: session.relationshipId, respondent_label: respondentLabel, response });
  if (error) return NextResponse.json({ error: "Unable to save your answer." }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
