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

async function checkTasksColumn() {
  const { data, error } = await supabase.from('focus_sprints').select('tasks').limit(1);
  if (error) {
    console.error("Error fetching tasks column:", error.message);
  } else {
    console.log("Tasks column found! Sample data:", data);
  }
}

checkTasksColumn();