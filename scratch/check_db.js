import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import fs from "node:fs";

// Dependency-free env file parser
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
  const { data: relationships, error: relErr } = await supabase
    .from("relationships")
    .select("id, recipient_name, slug");
  
  if (relErr) {
    console.error("Error fetching relationships:", relErr);
    return;
  }

  console.log("Found Relationships:", relationships);

  if (relationships && relationships.length > 0) {
    const relId = relationships[0].id;
    
    // We create a simple, easy-to-use access key
    const token = "love-universe-token";
    const tokenHash = createHash("sha256").update(token).digest("hex");
    
    // Remove if there's an existing link with the same label to keep DB clean
    await supabase
      .from("relationship_access_links")
      .delete()
      .eq("label", "Direct Developer Token");

    const { data: link, error: linkErr } = await supabase
      .from("relationship_access_links")
      .insert({
        relationship_id: relId,
        token_hash: tokenHash,
        label: "Direct Developer Token"
      })
      .select();
      
    if (linkErr) {
      console.error("Error generating link:", linkErr);
    } else {
      console.log("\n==============================================");
      console.log(">>> ACCESS CODE:", token);
      console.log(">>> ACCESS LINK: http://localhost:3000/me/unlock?token=" + token);
      console.log("==============================================\n");
    }
  } else {
    console.log("No relationships found in the database. Please initialize a relationship via the Admin Control Panel first!");
  }
}

run();
