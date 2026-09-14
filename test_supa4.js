const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://mzpqmovkxgvxxvexxhrs.supabase.co', 'sb_publishable_S-QA602E8nALSKRE9-BukQ_2RRoMCWJ');
async function check() {
  const { data, error } = await supabase.from('branches').select('*');
  console.log("BRANCHES:", data);
}
check();
