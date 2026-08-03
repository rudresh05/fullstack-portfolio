const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndCleanDb() {
  const { data: projects, error } = await supabase.from('projects').select('*');
  if (error) {
    console.error("Error fetching:", error);
    return;
  }
  
  console.log("Current projects in DB:");
  projects.forEach(p => console.log(`- ${p.title}`));
  
  const fallbackTitles = [
    "CampusCircle", 
    "Fullstack Portfolio", 
    "GitHub Pages Portfolio", 
    "Tree Data Structure", 
    "Recursion", 
    "Learn Kotlin Basics",
    "PathAI",
    "Music App",
    "Atmospheric Intelligence App",
    "Focus Os"
  ];
  
  for (const p of projects) {
    // If the title matches any of the old hardcoded/github ones, delete it
    if (fallbackTitles.includes(p.title) || p.title.toLowerCase().includes('portfolio') || p.title.toLowerCase().includes('app')) {
      console.log(`Deleting fallback project: ${p.title}`);
      await supabase.from('projects').delete().eq('id', p.id);
    }
  }
  console.log("Cleanup complete.");
}

checkAndCleanDb();
