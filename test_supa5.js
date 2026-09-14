const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://mzpqmovkxgvxxvexxhrs.supabase.co', 'sb_publishable_S-QA602E8nALSKRE9-BukQ_2RRoMCWJ');

async function check() {
  const { data: b, error: e1 } = await supabase.from('employees').select('*');
  console.log("EMPLOYEES:", b);
}
check();
