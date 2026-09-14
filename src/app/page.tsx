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
  MapPin
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MerchantDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeBranch, setActiveBranch] = useState('Semua Cabang');
  const [session, setSession] = useState<any>(null);
  
  const [totalSales, setTotalSales] = useState(0);
  const [totalTrx, setTotalTrx] = useState(0);
  const [salesData, setSalesData] = useState<any[]>([]);
  
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setSession(session);
        fetchDashboardData(session.user.id);
      }
    });
  }, [router]);

  const fetchDashboardData = async (merchantId: string) => {
    // Ambil semua transaksi milik merchant ini
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    if (transactions) {
      // Hitung total
      const sales = transactions.reduce((acc, curr) => acc + Number(curr.total), 0);
      setTotalSales(sales);
      setTotalTrx(transactions.length);

      // Kelompokkan per hari untuk chart
      const grouped = transactions.reduce((acc: any, curr: any) => {
        const date = new Date(curr.timestamp).toLocaleDateString('id-ID', { weekday: 'short' });
        acc[date] = (acc[date] || 0) + Number(curr.total);
        return acc;
      }, {});

      const chartData = Object.keys(grouped).map(key => ({
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

  if (!session) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-slate-800 text-lg leading-tight">PockidPOS</h1>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">SuperWeb</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" /> Ringkasan
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-600 hover:bg-red-50 transition-all">
            <LogOut className="w-5 h-5" /> Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <h2 className="text-2xl font-black text-slate-800">Ringkasan Eksekutif (Real-Time)</h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">{session.user.email}</p>
              <p className="text-xs font-medium text-slate-500">Super Admin</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-1">Rp {totalSales.toLocaleString('id-ID')}</h3>
              <p className="text-slate-500 text-sm font-medium">Total Omzet</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl"><Package className="w-6 h-6" /></div>
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-1">{totalTrx}</h3>
              <p className="text-slate-500 text-sm font-medium">Transaksi Selesai</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Link href="/products" className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
              <Package className="w-6 h-6 text-indigo-500" />
              <span className="text-sm font-bold text-slate-700">Manajemen Produk</span>
            </Link>
            <button className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
              <Users className="w-6 h-6 text-emerald-500" />
              <span className="text-sm font-bold text-slate-700">Pelanggan</span>
            </button>
            <button className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
              <Settings className="w-6 h-6 text-slate-500" />
              <span className="text-sm font-bold text-slate-700">Pengaturan</span>
            </button>
            <button onClick={handleLogout} className="p-4 bg-red-50 border border-red-100 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-red-100 transition-colors shadow-sm">
              <LogOut className="w-6 h-6 text-red-500" />
              <span className="text-sm font-bold text-red-700">Keluar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-6">Tren Penjualan (Tersinkronisasi Cloud)</h3>
              <div className="h-[300px] w-full">
                {salesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} 
                        tickFormatter={(value) => `Rp${value/1000}K`} 
                      />
                      <Tooltip 
                        formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Penjualan']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">Belum ada transaksi tersinkronisasi.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
