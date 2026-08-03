import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { supabaseAdmin } from '@/lib/supabase';

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').trim().toLowerCase();

async function requireAdmin(req: Request) {
  if (process.env.NODE_ENV === "development") {
    return null;
  }

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  try {
    const adminApp = getFirebaseAdmin();
    const decoded = await adminApp.auth().verifyIdToken(token);
    
    if (ADMIN_EMAIL && decoded.email?.toLowerCase() !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch (err: unknown) {
    console.error("Firebase Verification Error:", err);
    const message = err instanceof Error ? err.message : String(err);
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? (err as { code?: unknown }).code
        : undefined;
    return NextResponse.json({ 
      error: "Authentication failed", 
      message,
      code,
    }, { status: 401 });
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const body = await req.json();

    const { data, error } = await supabaseAdmin.from('projects').insert([
      {
        title: body.title,
        description: body.description,
        tech: body.tech || [],
        link: body.link,
        image_url: body.imageUrl || '',
        featured: body.featured || false,
      },
    ]);

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const { id } = await req.json();
    const { error } = await supabaseAdmin.from('projects').delete().eq('id', id);
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
