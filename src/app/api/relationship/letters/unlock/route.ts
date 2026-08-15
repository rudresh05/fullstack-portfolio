import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getRelationshipSession, hashPasscode } from "@/lib/relationship-server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const session = await getRelationshipSession();
  if (!session) {
    return NextResponse.json({ error: "Relationship access is required." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const letterId = typeof body.letterId === "string" ? body.letterId : "";
  const passcode = typeof body.passcode === "string" ? body.passcode : "";

  if (!letterId || !passcode) {
    return NextResponse.json({ error: "Letter ID and passcode are required." }, { status: 400 });
  }

  // Fetch the letter matching relationship_id and letterId
  const { data: letter, error } = await supabaseAdmin
    .from("letters")
    .select("body, signature, passcode_hash, access_rule")
    .eq("id", letterId)
    .eq("relationship_id", session.relationshipId)
    .maybeSingle();

  if (error || !letter) {
    return NextResponse.json({ error: "Letter not found." }, { status: 404 });
  }

  if (letter.access_rule !== "passcode" || !letter.passcode_hash) {
    return NextResponse.json({ error: "This letter does not require a passcode." }, { status: 400 });
  }

  const computedHash = hashPasscode(passcode);
  const expectedHash = letter.passcode_hash;

  try {
    const computedBuffer = Buffer.from(computedHash, "hex");
    const expectedBuffer = Buffer.from(expectedHash, "hex");

    if (
      computedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(computedBuffer, expectedBuffer)
    ) {
      return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  return NextResponse.json({ ok: true, body: letter.body, signature: letter.signature });
}
