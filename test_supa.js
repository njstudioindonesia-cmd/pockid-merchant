const { createClient } = require('@supabase/supabase-js');

// Baca file .env.local untuk mendapatkan URL dan KEY
const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const lines = envFile.split('\n');
let SUPABASE_URL = '';
let SUPABASE_KEY = '';

lines.forEach(line => {
  if(line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) SUPABASE_URL = line.split('=')[1].trim();
  if(line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) SUPABASE_KEY = line.split('=')[1].trim();
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data, error } = await supabase.from('employees').select('*');
  console.log("DATA:", data);
  console.log("ERROR:", error);
}

check();
