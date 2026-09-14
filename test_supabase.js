const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkData() {
  const { data: empData, error: empErr } = await supabase.from('employees').select('*');
  console.log("Employees:", empData, empErr);
  
  const { data: setData, error: setErr } = await supabase.from('merchant_settings').select('*');
  console.log("Settings:", setData, setErr);
}

checkData();
