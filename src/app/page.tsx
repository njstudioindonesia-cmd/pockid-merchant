'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  ArrowUpRight, ArrowDownRight, Store, Receipt, 
  Wallet, Users, ShoppingBag, Settings, LogOut, Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function MerchantDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [session, setSession] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  
  const [totalSales, setTotalSales] = useState(0);
  const [totalTrx, setTotalTrx] = useState(0);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [storeProfile, setStoreProfile] = useState<any>(null);

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setSession(session);
        fetchStoreProfile(session.user.id);
        fetchDashboardData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/login');
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const fetchStoreProfile = async (merchantId: string) => {
    const { data } = await supabase.from('branches').select('*').eq('merchant_id', merchantId).single();
    if (data) setStoreProfile(data);
  };

  const fetchDashboardData = async (merchantId: string) => {
    // Ambil daftar cabang
    const { data: branchData } = await supabase.from('branches').select('*').eq('merchant_id', merchantId);
    if (branchData) setBranches(branchData);

    // Ambil transaksi
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

    // Kelompokkan 7 hari terakhir
    const grouped = filtered.reduce((acc: any, curr: any) => {
      const date = new Date(curr.timestamp).toLocaleDateString('id-ID', { weekday: 'short' });
      acc[date] = (acc[date] || 0) + Number(curr.total);
      return acc;
    }, {});

    // Balik urutan agar kronologis (kiri ke kanan)
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

  if (!session) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

  const MENU_ITEMS = [
    { id: 'dashboard', label: 'Ringkasan Bisnis', icon: Store, route: '/' },
    { id: 'products', label: 'Manajemen Produk', icon: ShoppingBag, route: '/products' },
    { id: 'customers', label: 'Pelanggan & CRM', icon: Users, route: '/customers' },
    { id: 'reports', label: 'Laporan Penjualan', icon: Receipt, route: '/reports' },
    { id: 'settings', label: 'Pengaturan Toko', icon: Settings, route: '/settings' },
  ];

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0F172A] text-white flex flex-col shadow-2xl z-10 sticky top-0 h-screen">
        <div className="p-8 pb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">PockidPOS</h1>
              <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">SuperWeb Central</p>
            </div>
          </div>
        </div>

        <div className="px-4 mb-4">
          <p className="text-xs font-bold text-slate-500 mb-4 px-4 uppercase tracking-widest">Menu Utama</p>
          <nav className="space-y-1">
            {MENU_ITEMS.map((item) => (
              <Link 
                key={item.id}
                href={item.route}
                className={\lex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 \\}
              >
                <item.icon className={\w-5 h-5 \\} />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6">
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 backdrop-blur-sm">
            <p className="text-xs text-slate-400 font-medium mb-1">Status Sinkronisasi</p>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              Online & Tersinkron
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="w-full mt-4 flex items-center gap-3 text-slate-400 hover:text-rose-400 transition-colors px-4 py-2 font-bold text-sm group">
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        
        {/* TOP NAVBAR */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-20 px-10 py-5 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Selamat Datang, Super Merchant!</h2>
            <p className="text-sm font-medium text-slate-500 flex items-center gap-1"><Store className="w-4 h-4"/> Pusat Kendali Utama</p>
          </div>
          
          <div className="flex items-center gap-6">
            {branches.length > 0 && (
              <select 
                value={selectedBranch} 
                onChange={e => setSelectedBranch(e.target.value)}
                className="text-sm font-bold text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 shadow-sm hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Cabang</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
            <div className="relative hidden md:block">
              <input type="text" placeholder="Cari transaksi..." className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all w-64 font-medium" />
              <svg className="w-4 h-4 text-slate-400 absolute left-4 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center font-black shadow-sm group-hover:shadow-md transition-all">
                {session.user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-bold text-slate-700">{session.user.email?.split('@')[0]}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto space-y-8">
          
          {/* STATS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
              <div className="relative z-10 flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> +12%</span>
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1 relative z-10">Total Penjualan (Kotor)</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight relative z-10">Rp {totalSales.toLocaleString('id-ID')}</h3>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
              <div className="relative z-10 flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">Sukses</span>
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1 relative z-10">Total Transaksi</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight relative z-10">{totalTrx}</h3>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="p-3 bg-white/20 backdrop-blur-sm w-fit rounded-2xl mb-4 relative z-10">
                <Store className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-black mb-2 relative z-10">Kelola Produk</h3>
              <p className="text-indigo-100 text-sm font-medium relative z-10 leading-relaxed">Tambah menu baru dan biarkan tersinkronisasi otomatis ke seluruh cabang.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* CHART */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Tren Pendapatan</h3>
                  <p className="text-sm font-medium text-slate-500">Data masuk secara Real-Time dari Aplikasi Kasir</p>
                </div>
                <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none font-medium">
                  <option>7 Hari Terakhir</option>
                  <option>Bulan Ini</option>
                </select>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 500}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 500}} tickFormatter={(val) => \p\k\} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      itemStyle={{ color: '#4F46E5', fontWeight: 'bold' }}
                      labelStyle={{ color: '#64748B', fontWeight: 'bold', marginBottom: '4px' }}
                      formatter={(value: any) => [\Rp \\, 'Pendapatan']}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Transaksi Terkini</h3>
                <button className="text-indigo-600 text-sm font-bold hover:underline">Lihat Semua</button>
              </div>
              <div className="flex-1 space-y-4">
                {recentTransactions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 pt-10">
                    <Receipt className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium">Belum ada transaksi</p>
                  </div>
                ) : (
                  recentTransactions.map((trx) => (
                    <div key={trx.id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm">
                          {trx.cashier_name ? trx.cashier_name.charAt(0).toUpperCase() : 'K'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{trx.order_type === 'dine-in' ? 'Dine In' : 'Takeaway'}</p>
                          <p className="text-[11px] font-medium text-slate-500">{new Date(trx.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} • {trx.payment_method}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-800">Rp {Number(trx.total).toLocaleString('id-ID')}</p>
                        <p className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md inline-block mt-1">Berhasil</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
