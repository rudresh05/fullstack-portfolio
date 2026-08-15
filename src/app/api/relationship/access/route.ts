import { NextResponse } from "next/server";
import { COOKIE_NAME, createRelationshipSession } from "@/lib/relationship-server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";

  if (!token || token.length > 128) {
    return NextResponse.json({ error: "Please enter a valid key." }, { status: 400 });
  }

  const normalizedKey = token.toLowerCase();

  // Strictly ONLY two valid keywords: "rudra" and "tanya"
  const validKeys = ["rudra", "tanya"];

  if (validKeys.includes(normalizedKey)) {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    const response = NextResponse.json({ ok: true, unlocked: true });
    response.cookies.set(COOKIE_NAME, createRelationshipSession("primary-relationship", expiresAt), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });
    return response;
  }

  return NextResponse.json({ error: "Incorrect key. Please try again with love 💌" }, { status: 401 });
}
