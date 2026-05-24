const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  const res = {};
  const raw = fs.readFileSync(file, 'utf8');
  raw.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^(\w+)=(.*)$/);
    if (m) {
      res[m[1]] = m[2];
    }
  });
  return res;
}

(async () => {
  try {
    const root = path.resolve(__dirname, '..');
    const envFile = path.join(root, '.env.local');
    if (!fs.existsSync(envFile)) {
      console.error('.env.local not found');
      process.exit(2);
    }

    const env = loadEnv(envFile);
    const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('Supabase env vars missing in .env.local');
      process.exit(2);
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log('Supabase URL:', SUPABASE_URL);

    // Test upsert into settings
    const ts = new Date().toISOString();
    const settingKey = 'test_connection';
    const settingValue = { ok: true, ts };

    console.log('Upserting settings...', settingKey, settingValue);
    const upsertRes = await supabase.from('settings').upsert({ key: settingKey, value: settingValue }, { onConflict: 'key' });
    console.log('Upsert result error:', upsertRes.error);

    console.log('Fetching settings...');
    const fetchRes = await supabase.from('settings').select('key,value').eq('key', settingKey).single();
    console.log('Fetch error:', fetchRes.error);
    console.log('Fetch data:', fetchRes.data);

    // Insert a test project
    console.log('Inserting test project...');
    const project = {
      title: `Test Project ${ts}`,
      description: 'Automated test',
      tech: ['Test'],
      link: '#',
      featured: false,
    };
    const insertRes = await supabase.from('projects').insert([project]);
    console.log('Insert error:', insertRes.error);
    console.log('Insert data:', insertRes.data);

    // Fetch recent project
    const recent = await supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(5);
    console.log('Recent fetch error:', recent.error);
    console.log('Recent data length:', recent.data ? recent.data.length : 0);

    console.log('Test completed');
    process.exit(0);
  } catch (err) {
    console.error('Test failed', err);
    process.exit(1);
  }
})();
