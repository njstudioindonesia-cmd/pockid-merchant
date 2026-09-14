'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Download, FileSpreadsheet, Calendar, Search } from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('merchant_id', session.user.id)
      .order('timestamp', { ascending: false });

    if (data) setTransactions(data);
    setLoading(false);
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    
    // Header CSV
    let csvContent = "ID,Tanggal,Jam,Kasir,Tipe Pesanan,Metode Bayar,Total Omzet\n";
    
    // Baris CSV
    transactions.forEach(t => {
      const date = new Date(t.timestamp).toLocaleDateString('id-ID');
      const time = new Date(t.timestamp).toLocaleTimeString('id-ID');
      const row = `${t.id},${date},${time},${t.cashier_name || 'Admin'},${t.order_type || 'Retail'},${t.payment_method},${t.total}`;
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Penjualan_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
          <Link href="/" className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Laporan Penjualan</h1>
            <p className="text-slate-500 text-sm font-medium">Rekapitulasi seluruh transaksi yang ditarik secara Real-Time.</p>
          </div>
          <button onClick={handleExportCSV} className="ml-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
            <FileSpreadsheet className="w-5 h-5" /> Export ke Excel (CSV)
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex gap-4">
              <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-200 w-64">
                <Search className="w-5 h-5 text-slate-400 mr-2" />
                <input type="text" placeholder="Cari ID transaksi..." className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400 font-medium" />
              </div>
              <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-200">
                <Calendar className="w-5 h-5 text-slate-400 mr-2" />
                <span className="text-sm font-medium text-slate-600">Semua Waktu</span>
              </div>
            </div>
            <p className="text-sm font-bold text-slate-500">Total: {transactions.length} Transaksi</p>
          </div>

          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider">Tanggal & Waktu</th>
                <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider">Kasir / Staff</th>
                <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider">Tipe Pesanan</th>
                <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider">Pembayaran</th>
                <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider text-right">Total Transaksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <Download className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-lg font-bold text-slate-600">Data Kosong</p>
                    <p className="text-sm">Belum ada transaksi masuk dari aplikasi kasir.</p>
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-8">
                      <p className="font-bold text-slate-800 text-sm">{new Date(t.timestamp).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p className="text-xs font-bold text-indigo-500">{new Date(t.timestamp).toLocaleTimeString('id-ID')}</p>
                    </td>
                    <td className="py-4 px-8 font-medium text-slate-700">{t.cashier_name || 'Administrator'}</td>
                    <td className="py-4 px-8">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold uppercase">{t.order_type || 'Retail'}</span>
                    </td>
                    <td className="py-4 px-8">
                      <span className={`font-bold px-3 py-1 rounded-lg text-xs uppercase ${t.payment_method === 'cash' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                        {t.payment_method}
                      </span>
                    </td>
                    <td className="py-4 px-8 text-right font-black text-slate-800">
                      Rp {Number(t.total).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
