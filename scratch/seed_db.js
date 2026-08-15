import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import fs from "node:fs";

// Parse env file
let env = {};
try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const parts = trimmed.split("=");
    const key = parts[0].trim();
    let val = parts.slice(1).join("=").trim();
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  });
} catch (e) {
  console.error("Could not read .env.local file:", e);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL || "",
  env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function run() {
  console.log("Seeding relationship space...");

  // 1. Insert relationship
  const ownerUid = "dev-temp-owner-uid";
  const slug = "rudresh-and-anya";
  const recipientName = "Anya";

  // Check if one already exists
  const { data: existing } = await supabase
    .from("relationships")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  let relationshipId;
  if (existing) {
    relationshipId = existing.id;
    console.log("Using existing relationship ID:", relationshipId);
  } else {
    const { data: rel, error: relErr } = await supabase
      .from("relationships")
      .insert({
        owner_firebase_uid: ownerUid,
        slug,
        recipient_name: recipientName,
        status: "published"
      })
      .select("id")
      .single();

    if (relErr || !rel) {
      console.error("Error creating relationship:", relErr);
      return;
    }
    relationshipId = rel.id;
    console.log("Created relationship space:", relationshipId);
  }

  // 2. Insert Settings
  const { error: setErr } = await supabase
    .from("relationship_settings")
    .upsert({
      relationship_id: relationshipId,
      hero_title: "Anya Patel",
      hero_subtitle: "You are my favorite memory, my greatest adventure.",
      story_heading: "Every chapter begins with you",
      story_body: "Some stories don't have a single beginning. They unfold slowly, in moments you only recognize as important later. These are ours.",
      music_enabled: false
    });
  if (setErr) console.error("Error updating settings:", setErr);

  // 3. Clear and Insert Timeline Events
  await supabase.from("timeline_events").delete().eq("relationship_id", relationshipId);
  const { error: timeErr } = await supabase
    .from("timeline_events")
    .insert([
      {
        relationship_id: relationshipId,
        title: "The Day We Met",
        body: "I didn't know it then, but that was the day everything changed. A simple hello that rewrote my entire universe.",
        occurred_on: "2024-04-12",
        location_name: "Cozy Coffee House, Downtown",
        sort_order: 0,
        is_published: true
      },
      {
        relationship_id: relationshipId,
        title: "The First Time I Knew",
        body: "Walking under the city lights, laughing about absolutely nothing. It clicked — you were the one I wanted to share all my walks with.",
        occurred_on: "2024-07-20",
        location_name: "Riverfront Pier",
        sort_order: 1,
        is_published: true
      },
      {
        relationship_id: relationshipId,
        title: "Our First Travel Adventure",
        body: "Lost tickets, missed trains, and poured rain — yet it was the perfect weekend because we were together.",
        occurred_on: "2025-02-14",
        location_name: "Paris, France",
        sort_order: 2,
        is_published: true
      }
    ]);
  if (timeErr) console.error("Error inserting timeline events:", timeErr);

  // 4. Clear and Insert Memories
  await supabase.from("memories").delete().eq("relationship_id", relationshipId);
  const { error: memErr } = await supabase
    .from("memories")
    .insert([
      {
        relationship_id: relationshipId,
        title: "A Sunset to Remember",
        caption: "Golden hour and quiet smiles",
        narrative: "We sat on the hood of the car, watching the sun dip below the hills. You fell asleep on my shoulder, and I wished I could freeze time forever.",
        occurred_on: "2024-09-05",
        location_name: "Sunset Ridge Vista",
        mood: "peaceful",
        tags: ["sunset", "nature"],
        sort_order: 0,
        is_published: true
      },
      {
        relationship_id: relationshipId,
        title: "Late Night Kitchen Concerts",
        caption: "Dancing like nobody is watching",
        narrative: "Singing off-key into wooden spoons at 2 AM while baking cookies we probably shouldn't have been eating. The kitchen was a mess, but we were happy.",
        occurred_on: "2024-11-18",
        location_name: "Our Kitchen",
        mood: "joyful",
        tags: ["home", "baking", "dance"],
        sort_order: 1,
        is_published: true
      }
    ]);
  if (memErr) console.error("Error inserting memories:", memErr);

  // 5. Clear and Insert Letters
  await supabase.from("letters").delete().eq("relationship_id", relationshipId);
  const { error: letErr } = await supabase
    .from("letters")
    .insert([
      {
        relationship_id: relationshipId,
        title: "Read me when you need a smile",
        body: "Just in case you forgot: you are loved, you are appreciated, and you make this world a significantly brighter place just by being in it. Whenever things get overwhelming, take a deep breath. I'm right here in your corner. Always.",
        signature: "Your favorite person",
        access_rule: "shared",
        sort_order: 0,
        is_published: true
      },
      {
        relationship_id: relationshipId,
        title: "A letter locked with a secret",
        body: "You opened it! I wanted to write this down because words fade but this is printed on our shared digital universe. I love the way your eyes crinkle when you laugh, the way you make random songs, and how you make any room feel like home. Thank you for being you.",
        signature: "Always yours",
        access_rule: "passcode",
        passcode_hash: createHash("sha256").update(createHash("sha256").update("together").digest("hex")).digest("hex"), // match double hash access if needed, or simple hash
        // Wait, relationship-server.ts uses createHmac("sha256", SESSION_SECRET).update(passcode).digest("hex")
        // Since we can't easily compute HMAC without reading SESSION_SECRET from env, we will update it using the server utility below:
        sort_order: 1,
        is_published: true
      }
    ]);
  if (letErr) console.error("Error inserting letters:", letErr);

  // Re-hash the passcode using the correct server HMAC if secret is configured
  const sessionSecret = env.RELATIONSHIP_SESSION_SECRET || "";
  if (sessionSecret) {
    const computedHmacHash = createHash("sha256"); // fallback
    const hmac = createHash("sha256"); // let's do a simple fallback or correct hmac
    const crypto = await import("node:crypto");
    const correctHmacHash = crypto.createHmac("sha256", sessionSecret).update("together").digest("hex");
    
    await supabase
      .from("letters")
      .update({ passcode_hash: correctHmacHash })
      .eq("relationship_id", relationshipId)
      .eq("title", "A letter locked with a secret");
  }

  // 6. Clear and Insert Questions
  await supabase.from("questions").delete().eq("relationship_id", relationshipId);
  const { error: qErr } = await supabase
    .from("questions")
    .insert([
      {
        relationship_id: relationshipId,
        prompt: "Where should we go for our next big travel getaway?",
        helper_text: "Write down the country or city you've been dreaming of exploring next.",
        response_type: "short_text",
        is_required: true,
        is_active: true,
        sort_order: 0
      },
      {
        relationship_id: relationshipId,
        prompt: "What is your favorite memory of us from this past year?",
        helper_text: "Share the little details of a day or moment that stayed in your heart.",
        response_type: "long_text",
        is_required: false,
        is_active: true,
        sort_order: 1
      }
    ]);
  if (qErr) console.error("Error inserting questions:", qErr);

  // 7. Clear and Insert Bucket List Items
  await supabase.from("bucket_list_items").delete().eq("relationship_id", relationshipId);
  const { error: bErr } = await supabase
    .from("bucket_list_items")
    .insert([
      {
        relationship_id: relationshipId,
        title: "See the Northern Lights",
        description: "Camp out in a glass igloo in Finland and watch the green lights dance.",
        category: "travel",
        status: "planned",
        sort_order: 0
      },
      {
        relationship_id: relationshipId,
        title: "Adopt a Golden Retriever",
        description: "Name him Waffles and teach him how to fetch coffee cups.",
        category: "home",
        status: "planned",
        sort_order: 1
      },
      {
        relationship_id: relationshipId,
        title: "Learn to Cook Italian Pasta From Scratch",
        description: "Roll out pasta dough together in a warm kitchen.",
        category: "together",
        status: "in_progress",
        sort_order: 2
      }
    ]);
  if (bErr) console.error("Error inserting bucket list:", bErr);

  // 8. Clear and Insert Future Places
  await supabase.from("future_places").delete().eq("relationship_id", relationshipId);
  const { error: pErr } = await supabase
    .from("future_places")
    .insert([
      {
        relationship_id: relationshipId,
        name: "Kyoto, Japan",
        story: "Walking through the bamboo forests and visiting traditional temples during cherry blossom season.",
        is_visited: false,
        sort_order: 0
      },
      {
        relationship_id: relationshipId,
        name: "Amalfi Coast, Italy",
        story: "Driving a vintage Vespa along the cliffs and eating lemon gelato by the blue ocean.",
        is_visited: false,
        sort_order: 1
      }
    ]);
  if (pErr) console.error("Error inserting future places:", pErr);

  // 9. Clear and Insert Access Token Link
  const token = "love-universe-token";
  const tokenHash = createHash("sha256").update(token).digest("hex");

  await supabase
    .from("relationship_access_links")
    .delete()
    .eq("label", "Direct Developer Token");

  const { data: link, error: linkErr } = await supabase
    .from("relationship_access_links")
    .insert({
      relationship_id: relationshipId,
      token_hash: tokenHash,
      label: "Direct Developer Token"
    })
    .select();

  if (linkErr) {
    console.error("Error generating access link:", linkErr);
  } else {
    console.log("\n========================================================");
    console.log(">>> DATABASE SEEDING COMPLETED SUCCESSFUL!");
    console.log(">>> YOUR ACCESS CODE IS: love-universe-token");
    console.log(">>> OR USE LINK: http://localhost:3000/me/unlock?token=love-universe-token");
    console.log(">>> PASSCODE FOR THE SEALED LETTER IS: together");
    console.log("========================================================\n");
  }
}

run();
