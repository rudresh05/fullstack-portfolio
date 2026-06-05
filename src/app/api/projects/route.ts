import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch {
    // A malformed local service-account value should not crash static builds.
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  (process.env.NODE_ENV !== 'production' ? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY : '') ??
  '';

async function requireAdmin(req: Request) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT && process.env.NODE_ENV !== 'production') {
    return null;
  }

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  if (!admin.apps.length) return NextResponse.json({ error: 'Firebase admin is not configured.' }, { status: 500 });

  const decoded = await admin.auth().verifyIdToken(token);
  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').trim().toLowerCase();
  if (adminEmail && decoded.email?.toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase credentials are missing.');
  }

  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

export async function POST(req: Request) {
  try {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const body = await req.json();
    const supabase = getSupabase();

    const { data, error } = await supabase.from('projects').insert([
      {
        title: body.title,
        description: body.description,
        tech: body.tech,
        link: body.link,
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
    const supabase = getSupabase();
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
