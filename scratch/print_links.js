import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

// Parse env
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
  console.error("Error reading env:", e);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL || "",
  env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function run() {
  const { data: links, error: linkErr } = await supabase
    .from("relationship_access_links")
    .select("*");
    
  console.log("Current Links in DB:", links, linkErr);
}

run();
