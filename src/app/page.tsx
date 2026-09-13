'use client';

import React, { useState } from 'react';
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

const salesData = [
  { name: 'Senin', sales: 4000000 },
  { name: 'Selasa', sales: 3000000 },
  { name: 'Rabu', sales: 2000000 },
  { name: 'Kamis', sales: 2780000 },
  { name: 'Jumat', sales: 1890000 },
  { name: 'Sabtu', sales: 2390000 },
  { name: 'Minggu', sales: 3490000 },
];

export default function MerchantDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeBranch, setActiveBranch] = useState('Semua Cabang');

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
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Backoffice</p>
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
          <button 
            onClick={() => setActiveTab('branches')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'branches' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Store className="w-5 h-5" /> Multi-Cabang
          </button>
          <button 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            <Package className="w-5 h-5" /> Menu Global
          </button>
          <button 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            <Users className="w-5 h-5" /> CRM Member
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-600 hover:bg-red-50 transition-all">
            <LogOut className="w-5 h-5" /> Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-800">Ringkasan Eksekutif</h2>
            
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {['Semua Cabang', 'Sudirman', 'Kemang', 'Bintaro'].map(branch => (
                <button
                  key={branch}
                  onClick={() => setActiveBranch(branch)}
                  className={`px-4 py-1.5 rounded-md font-bold text-sm transition-all ${
                    activeBranch === branch ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {branch}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-50"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">Kopi Kenangan Mantan</p>
                <p className="text-xs font-medium text-slate-500">Super Admin</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-black">
                KK
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
                <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded-full">+12.5%</span>
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-1">Rp 19.55M</h3>
              <p className="text-slate-500 text-sm font-medium">Omzet {activeBranch} (Bulan Ini)</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl"><Package className="w-6 h-6" /></div>
                <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded-full">+5.2%</span>
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-1">1,423</h3>
              <p className="text-slate-500 text-sm font-medium">Cup Terjual</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-amber-50 text-amber-600 p-3 rounded-xl"><Users className="w-6 h-6" /></div>
                <span className="bg-rose-50 text-rose-600 text-xs font-bold px-2 py-1 rounded-full">-2.1%</span>
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-1">8,211</h3>
              <p className="text-slate-500 text-sm font-medium">Kunjungan Pelanggan</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-rose-50 text-rose-600 p-3 rounded-xl"><Store className="w-6 h-6" /></div>
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-1">3</h3>
              <p className="text-slate-500 text-sm font-medium">Cabang Aktif Sinkronisasi</p>
            </div>
          </div>

          {/* Charts & Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Tren Penjualan 7 Hari Terakhir</h3>
                  <p className="text-sm font-medium text-slate-500">{activeBranch}</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
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
                      tickFormatter={(value) => `Rp${value/1000000}M`} 
                    />
                    <Tooltip 
                      formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Penjualan']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <h3 className="text-lg font-black text-slate-800 mb-6">Performa Cabang</h3>
              <div className="flex-1 space-y-4">
                {[
                  { name: 'Sudirman', sales: 'Rp 8.5M', target: 92, status: 'Online' },
                  { name: 'Kemang', sales: 'Rp 6.2M', target: 78, status: 'Online' },
                  { name: 'Bintaro', sales: 'Rp 4.8M', target: 105, status: 'Offline (Sinkronisasi Tertunda)' },
                ].map((branch, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-sm">{branch.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${branch.status.includes('Online') ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{branch.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-indigo-600">{branch.sales}</p>
                      <p className={`text-xs font-bold ${branch.target >= 100 ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {branch.target}% Target
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors">
                Lihat Detail Laporan
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
