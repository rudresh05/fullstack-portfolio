import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/relationship-server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const ownerId = await requireAdmin(request);
    
    // Find the relationship owned by this admin
    const { data: relationship, error: relErr } = await supabaseAdmin
      .from("relationships")
      .select("id")
      .eq("owner_firebase_uid", ownerId)
      .maybeSingle();
      
    if (relErr || !relationship) {
      return NextResponse.json({ error: "No relationship space found." }, { status: 404 });
    }
    
    // Fetch all submitted question answers for this relationship
    const { data: answers, error: ansErr } = await supabaseAdmin
      .from("question_answers")
      .select("id, question_id, respondent_label, response, submitted_at, question:questions(prompt)")
      .eq("relationship_id", relationship.id)
      .order("submitted_at", { ascending: false });
      
    if (ansErr) {
      return NextResponse.json({ error: ansErr.message }, { status: 500 });
    }
    
    const formattedAnswers = (answers || []).map((row: any) => ({
      id: row.id,
      questionId: row.question_id,
      prompt: row.question?.prompt || "Deleted Question",
      respondentLabel: row.respondent_label || "Anonymous Partner",
      response: row.response,
      submittedAt: row.submitted_at,
    }));
    
    return NextResponse.json({ data: formattedAnswers });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unauthorized." }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  try {
    const ownerId = await requireAdmin(request);
    
    const { data: relationship } = await supabaseAdmin
      .from("relationships")
      .select("id")
      .eq("owner_firebase_uid", ownerId)
      .maybeSingle();
      
    if (!relationship) {
      return NextResponse.json({ error: "No relationship space found." }, { status: 404 });
    }
    
    const body = await request.json().catch(() => ({}));
    const answerId = typeof body.id === "string" ? body.id : "";
    if (!answerId) {
      return NextResponse.json({ error: "Answer ID is required." }, { status: 400 });
    }
    
    // Delete the answer ensuring it belongs to this relationship
    const { error } = await supabaseAdmin
      .from("question_answers")
      .delete()
      .eq("id", answerId)
      .eq("relationship_id", relationship.id);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unauthorized." }, { status: 401 });
  }
}
