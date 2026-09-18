const fs = require('fs');
const path = 'src/app/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add states
code = code.replace(
  "const [storeProfile, setStoreProfile] = useState<any>(null);",
  "const [storeProfile, setStoreProfile] = useState<any>(null);\n  const [branches, setBranches] = useState<any[]>([]);\n  const [selectedBranch, setSelectedBranch] = useState<string>('all');\n  const [allTransactions, setAllTransactions] = useState<any[]>([]);"
);

// Fetch branches
const fetchLogic = `
  const fetchDashboardData = async (merchantId: string) => {
    // Ambil daftar cabang
    const { data: branchData } = await supabase.from('branches').select('*').eq('merchant_id', merchantId);
    if (branchData) setBranches(branchData);

    // Ambil semua transaksi
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('timestamp', { ascending: false });

    if (!error && transactions) {
      setAllTransactions(transactions);
      processData(transactions, 'all');
    }
  };

  const processData = (transactions: any[], branchId: string) => {
    let filtered = transactions;
    if (branchId !== 'all') {
      filtered = transactions.filter(t => t.branch_id === branchId);
    }

    const sales = filtered.reduce((acc, curr) => acc + Number(curr.total), 0);
    setTotalSales(sales);
    setTotalTrx(filtered.length);
    setRecentTransactions(filtered.slice(0, 5));

    const grouped = filtered.reduce((acc: any, curr: any) => {
      const date = new Date(curr.timestamp).toLocaleDateString('id-ID', { weekday: 'short' });
      acc[date] = (acc[date] || 0) + Number(curr.total);
      return acc;
    }, {});

    const chartData = Object.keys(grouped).reverse().map(key => ({
      name: key,
      sales: grouped[key]
    }));
    setSalesData(chartData);
  };

  useEffect(() => {
    if (allTransactions.length > 0) {
      processData(allTransactions, selectedBranch);
    }
  }, [selectedBranch]);
`;

code = code.replace(
  /const fetchDashboardData = async \(merchantId: string\) => \{[\s\S]*?setSalesData\(chartData\);\s*\};/,
  fetchLogic
);

// Add the branch filter dropdown
code = code.replace(
  /<button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors">/,
  `{branches.length > 0 && (
              <select 
                value={selectedBranch} 
                onChange={e => setSelectedBranch(e.target.value)}
                className="text-sm font-bold text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 shadow-sm hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 mr-4"
              >
                <option value="all">Semua Cabang</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}\n            <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors">`
);

fs.writeFileSync(path, code, 'utf8');
