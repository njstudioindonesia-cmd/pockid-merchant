const fs = require('fs');
const path = 'src/app/settings/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace branch fetch logic
code = code.replace(
  /const \{ data: branchData \} = await supabase\.from\('branches'\)\.select\('\*'\)\.eq\('merchant_id', session\.user\.id\)\.single\(\);/g,
  "const { data: branchData } = await supabase.from('branches').select('*').eq('merchant_id', session.user.id);"
);

// We need to add branches state
code = code.replace(
  "const [employees, setEmployees] = useState<any[]>([]);",
  "const [employees, setEmployees] = useState<any[]>([]);\n  const [branches, setBranches] = useState<any[]>([]);\n  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);\n  const [branchForm, setBranchForm] = useState({ id: '', name: '', address: '' });"
);

// In fetchStoreProfile, handle the array
code = code.replace(
  /if \(branchData\) \{\s*setStoreId\(branchData\.id\);\s*setFormData\(\{\s*name: branchData\.name \|\| '',\s*address: branchData\.address \|\| '',\s*tax_rate: '0',\s*receipt_footer: 'Terima kasih telah berbelanja!'\s*\}\);\s*\}/s,
  "if (branchData && branchData.length > 0) {\n        setBranches(branchData);\n        setStoreId(branchData[0].id);\n        setFormData({\n          name: branchData[0].name || '',\n          address: branchData[0].address || '',\n          tax_rate: '0',\n          receipt_footer: 'Terima kasih telah berbelanja!'\n        });\n      }"
);

fs.writeFileSync(path, code);
