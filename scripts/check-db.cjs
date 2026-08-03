const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function checkDb() {
  const { data, error } = await supabase.from('projects').select('title');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

checkDb();
