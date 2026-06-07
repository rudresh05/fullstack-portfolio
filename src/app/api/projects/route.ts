import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  (process.env.NODE_ENV !== 'production' ? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY : '') ??
  '';
const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').trim().toLowerCase();

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
