'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Download, FileSpreadsheet, Calendar, Search, TrendingUp, DollarSign, Wallet, Eye, X, Receipt } from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionItems, setTransactionItems] = useState<any[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, any>>({});
  
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal Detail
  const [selectedTrx, setSelectedTrx] = useState<any | null>(null);

  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    // 1. Fetch Transactions
    const { data: trxData } = await supabase
      .from('transactions')
      .select('*')
      .eq('merchant_id', session.user.id)
      .order('timestamp', { ascending: false });

    // 2. Fetch Transaction Items (untuk detail pesanan)
    const { data: itemsData } = await supabase
      .from('transaction_items')
      .select('*');

    // 3. Fetch Products (untuk mendapatkan HPP / Capital Price)
    const { data: prodData } = await supabase
      .from('products')
      .select('id, name, capital_price')
      .eq('merchant_id', session.user.id);

    const pMap: Record<string, any> = {};
    if (prodData) {
      prodData.forEach(p => {
        pMap[p.id] = p;
      });
    }

    if (trxData) setTransactions(trxData);
    if (itemsData) setTransactionItems(itemsData);
    setProductsMap(pMap);
    
    setLoading(false);
  };

  // Kalkulasi & Filter
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter Tanggal
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(t => {
        const trxDate = new Date(t.timestamp);
        if (dateFilter === 'today') {
          return trxDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return trxDate >= weekAgo;
        } else if (dateFilter === 'month') {
          return trxDate.getMonth() === now.getMonth() && trxDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    // Filter Pencarian
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.id.toLowerCase().includes(lowerQ) || 
        (t.cashier_name && t.cashier_name.toLowerCase().includes(lowerQ))
      );
    }

    return filtered;
  }, [transactions, dateFilter, searchQuery]);

  const metrics = useMemo(() => {
    let totalGross = 0; // Omzet
    let totalCapital = 0; // Modal / HPP

    filteredTransactions.forEach(trx => {
      totalGross += Number(trx.total);
      
      // Hitung Modal dari items
      const items = transactionItems.filter(item => item.transaction_id === trx.id);
      items.forEach(item => {
        const product = productsMap[item.product_id];
        const hpp = product ? Number(product.capital_price || 0) : 0;
        totalCapital += hpp * item.quantity;
      });
    });

    const netProfit = totalGross - totalCapital;

    return { totalGross, totalCapital, netProfit };
  }, [filteredTransactions, transactionItems, productsMap]);

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    
    let csvContent = "ID,Tanggal,Jam,Kasir,Tipe Pesanan,Metode Bayar,Total Omzet,Estimasi Modal,Estimasi Laba\n";
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.timestamp).toLocaleDateString('id-ID');
      const time = new Date(t.timestamp).toLocaleTimeString('id-ID');
      
      // Hitung Modal per transaksi
      const items = transactionItems.filter(item => item.transaction_id === t.id);
      let modalTrx = 0;
      items.forEach(item => {
        const product = productsMap[item.product_id];
        modalTrx += (product ? Number(product.capital_price || 0) : 0) * item.quantity;
      });
      const labaTrx = Number(t.total) - modalTrx;

      const row = `${t.id},${date},${time},${t.cashier_name || 'Admin'},${t.order_type || 'Retail'},${t.payment_method},${t.total},${modalTrx},${labaTrx}`;
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Laba_Rugi_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTransactionDetailItems = (trxId: string) => {
    return transactionItems.filter(item => item.transaction_id === trxId);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-12">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
          <Link href="/" className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Akuntansi & Laba Rugi</h1>
            <p className="text-slate-500 text-sm font-medium">Analisis mendalam setiap transaksi dari mesin kasir Anda.</p>
          </div>
          <button onClick={handleExportCSV} className="ml-auto px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
            <FileSpreadsheet className="w-5 h-5" /> Download Laporan (Excel)
          </button>
        </div>

        {/* Dashboard Metrik Laba Rugi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md"><Wallet className="w-5 h-5" /></div>
                <h3 className="font-bold text-indigo-100">Omzet Kotor (Gross)</h3>
              </div>
              <h2 className="text-3xl font-black tracking-tight">Rp {metrics.totalGross.toLocaleString('id-ID')}</h2>
              <p className="text-sm text-indigo-200 mt-2 font-medium">Total seluruh uang masuk.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500"><DollarSign className="w-5 h-5" /></div>
              <h3 className="font-bold text-slate-500">Total Modal (HPP)</h3>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-800">Rp {metrics.totalCapital.toLocaleString('id-ID')}</h2>
            <p className="text-sm text-slate-400 mt-2 font-medium">Biaya modal barang terjual.</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md"><TrendingUp className="w-5 h-5" /></div>
                <h3 className="font-bold text-emerald-100">Laba Bersih (Net Profit)</h3>
              </div>
              <h2 className="text-3xl font-black tracking-tight">Rp {metrics.netProfit.toLocaleString('id-ID')}</h2>
              <p className="text-sm text-emerald-200 mt-2 font-medium">Keuntungan nyata yang masuk saku.</p>
            </div>
          </div>
        </div>

        {/* Tabel Transaksi */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-200 w-full md:w-80">
              <Search className="w-5 h-5 text-slate-400 mr-2" />
              <input type="text" placeholder="Cari ID transaksi atau Kasir..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400 font-medium" />
            </div>
            
            <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl">
              {(['all', 'today', 'week', 'month'] as const).map(filter => (
                <button 
                  key={filter} 
                  onClick={() => setDateFilter(filter)}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${dateFilter === filter ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {filter === 'all' ? 'Semua Waktu' : filter === 'today' ? 'Hari Ini' : filter === 'week' ? '7 Hari' : 'Bulan Ini'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider">Transaksi</th>
                  <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider">Kasir & Tipe</th>
                  <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider">Item Terjual</th>
                  <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider">Total & Pembayaran</th>
                  <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider text-right">Detail</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <Download className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                      <p className="text-lg font-bold text-slate-600">Tidak ada transaksi ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => {
                    const items = getTransactionDetailItems(t.id);
                    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

                    return (
                      <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-8">
                          <p className="text-xs font-bold text-indigo-500 mb-1">{t.id.split('-')[1] || t.id.substring(0,8)}</p>
                          <p className="font-bold text-slate-800 text-sm">{new Date(t.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(t.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</p>
                        </td>
                        <td className="py-4 px-8">
                          <p className="font-bold text-slate-700">{t.cashier_name || 'Administrator'}</p>
                          <span className="inline-block mt-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{t.order_type || 'Retail'}</span>
                        </td>
                        <td className="py-4 px-8">
                          <span className="font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                            {totalItems} <span className="text-slate-400 font-medium">Barang</span>
                          </span>
                        </td>
                        <td className="py-4 px-8">
                          <p className="font-black text-slate-800">Rp {Number(t.total).toLocaleString('id-ID')}</p>
                          <span className={`inline-block mt-1 font-bold px-2 py-0.5 rounded text-[10px] uppercase ${t.payment_method === 'cash' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {t.payment_method}
                          </span>
                        </td>
                        <td className="py-4 px-8 text-right">
                          <button onClick={() => setSelectedTrx(t)} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm">
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Detail Transaksi */}
      {selectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Receipt className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-lg font-black text-slate-800">Struk Digital</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{selectedTrx.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTrx(null)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-[#F8FAFC]">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 border-dashed mb-6">
                <div className="text-center border-b border-slate-200 border-dashed pb-4 mb-4">
                  <h3 className="font-black text-slate-800 text-xl">Transaksi Sukses</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">{new Date(selectedTrx.timestamp).toLocaleString('id-ID')}</p>
                  <p className="text-xs font-bold text-slate-400 mt-2 uppercase">Kasir: {selectedTrx.cashier_name || 'Admin'}</p>
                </div>
                
                <div className="space-y-4">
                  {getTransactionDetailItems(selectedTrx.id).map((item, idx) => {
                    const product = productsMap[item.product_id];
                    const hpp = product ? Number(product.capital_price || 0) : 0;
                    const profitItem = (Number(item.price) - hpp) * item.quantity;

                    return (
                      <div key={idx} className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{item.product_name}</p>
                          <p className="text-xs font-medium text-slate-500">{item.quantity}x @ Rp {Number(item.price).toLocaleString('id-ID')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-800 text-sm">Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}</p>
                          <p className="text-[10px] font-bold text-emerald-500">+ Laba: Rp {profitItem.toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-slate-200 border-dashed pt-4 mt-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500">Subtotal</span>
                    <span className="font-bold text-slate-700">Rp {Number(selectedTrx.subtotal).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500">Pajak / Biaya</span>
                    <span className="font-bold text-slate-700">Rp {Number(selectedTrx.tax).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100">
                    <span className="font-black text-slate-800 text-lg">Total Bayar</span>
                    <span className="font-black text-indigo-600 text-xl">Rp {Number(selectedTrx.total).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white">
              <button onClick={() => setSelectedTrx(null)} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition-all">
                Tutup Struk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
