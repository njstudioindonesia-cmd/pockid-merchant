'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  Package, 
  Settings, 
  TrendingUp, 
  Coffee, 
  Bell, 
  LogOut,
  MapPin,
  Search,
  ChevronDown,
  ArrowUpRight,
  Receipt
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MerchantDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [session, setSession] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  
  const [totalSales, setTotalSales] = useState(0);
  const [totalTrx, setTotalTrx] = useState(0);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [storeProfile, setStoreProfile] = useState<any>(null);
  
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setSession(session);
        fetchDashboardData(session.user.id);
        fetchStoreProfile(session.user.id);
      }
    });
  }, [router]);

  const fetchStoreProfile = async (merchantId: string) => {
    const { data } = await supabase.from('branches').select('*').eq('merchant_id', merchantId).single();
    if (data) setStoreProfile(data);
  };

  const fetchDashboardData = async (merchantId: string) => {
    // Ambil transaksi
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('timestamp', { ascending: false });

    if (!error && transactions) {
      const sales = transactions.reduce((acc, curr) => acc + Number(curr.total), 0);
      setTotalSales(sales);
      setTotalTrx(transactions.length);
      setRecentTransactions(transactions.slice(0, 5));

      // Kelompokkan 7 hari terakhir
      const grouped = transactions.reduce((acc: any, curr: any) => {
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
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!session) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-bold">Memuat SuperWeb...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 font-sans">
      {/* Sidebar - Dark Modern Theme */}
      <aside className="w-72 bg-[#0F172A] flex flex-col hidden md:flex text-slate-300 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="p-8 flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Coffee className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-black text-white text-xl tracking-tight">PockidPOS</h1>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">SuperWeb Central</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 relative z-10">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Menu Utama</p>
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-slate-800/50 hover:text-white'}`}>
            <LayoutDashboard className="w-5 h-5" /> Ringkasan Bisnis
          </button>
          <Link href="/products" className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 hover:bg-slate-800/50 hover:text-white">
            <Package className="w-5 h-5" /> Manajemen Produk
          </Link>
          <Link href="/customers" className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 hover:bg-slate-800/50 hover:text-white">
            <Users className="w-5 h-5" /> Pelanggan & CRM
          </Link>
          <Link href="/reports" className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 hover:bg-slate-800/50 hover:text-white">
            <TrendingUp className="w-5 h-5" /> Laporan Penjualan
          </Link>
          <Link href="/settings" className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 hover:bg-slate-800/50 hover:text-white">
            <Settings className="w-5 h-5" /> Pengaturan Toko
          </Link>
        </nav>

        <div className="p-6 relative z-10">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 mb-4">
            <p className="text-xs text-slate-400 mb-1">Status Sinkronisasi</p>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> Online & Tersinkron
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-bold text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all">
            <LogOut className="w-5 h-5" /> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-10 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Selamat Datang, {storeProfile?.name || 'Super Merchant'}!</h2>
            <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {storeProfile?.address || 'Pusat Kendali Utama'}
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center bg-slate-100 rounded-full px-4 py-2 border border-slate-200">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input type="text" placeholder="Cari transaksi..." className="bg-transparent border-none outline-none text-sm w-48 text-slate-700 placeholder:text-slate-400" />
            </div>
            <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                {session.user.email.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-slate-800 leading-none">{session.user.email.split('@')[0]}</p>
                <p className="text-[11px] font-medium text-slate-500 mt-1">Super Admin</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-10">
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-indigo-50 text-indigo-600 p-3.5 rounded-2xl border border-indigo-100/50"><TrendingUp className="w-6 h-6" /></div>
                  <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
                    <ArrowUpRight className="w-3 h-3 mr-1" /> +12%
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-semibold mb-1">Total Penjualan (Kotor)</p>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">Rp {totalSales.toLocaleString('id-ID')}</h3>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-2xl border border-emerald-100/50"><Receipt className="w-6 h-6" /></div>
                  <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
                    <ArrowUpRight className="w-3 h-3 mr-1" /> Sukses
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-semibold mb-1">Total Transaksi</p>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">{totalTrx}</h3>
              </div>
            </div>

            <Link href="/products" className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-lg shadow-indigo-500/20 relative overflow-hidden group hover:shadow-xl transition-all flex flex-col justify-between cursor-pointer">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-700 blur-xl"></div>
              <div className="relative z-10">
                <div className="bg-white/20 text-white p-3.5 rounded-2xl w-max backdrop-blur-md mb-6"><Package className="w-6 h-6" /></div>
                <h3 className="text-2xl font-black text-white mb-2">Kelola Produk</h3>
                <p className="text-indigo-100 text-sm font-medium">Tambah menu baru dan biarkan tersinkronisasi otomatis ke seluruh cabang.</p>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Area */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm">
              <div className="flex justify-between items-center mb-8">
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
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12, fontWeight: 500}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12, fontWeight: 500}} tickFormatter={(val) => `Rp${val/1000}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [`Rp ${Number(value || 0).toLocaleString('id-ID')}`, 'Omzet']}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" activeDot={{r: 6, strokeWidth: 0, fill: '#6366F1'}} />
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
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded text-center">Berhasil</span>
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
