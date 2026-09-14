'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Plus, Users, Edit, Trash2, Loader2, ArrowLeft, Search, X, Award, Phone } from 'lucide-react';
import Link from 'next/link';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

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

    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('merchant_id', session.user.id)
      .order('total_spent', { ascending: false });

    if (data) setCustomers(data);
    setLoading(false);
  };

  const openModal = (customer: any = null) => {
    if (customer) {
      setEditingId(customer.id);
      setFormData({
        name: customer.name,
        phone: customer.phone || '',
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', phone: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const payload = {
      merchant_id: session.user.id,
      name: formData.name,
      phone: formData.phone,
    };

    if (editingId) {
      await supabase.from('customers').update(payload).eq('id', editingId);
    } else {
      await supabase.from('customers').insert([payload]);
    }

    setIsModalOpen(false);
    setIsSubmitting(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pelanggan ini? Riwayat transaksi mereka tidak akan terhapus.')) return;
    await supabase.from('customers').delete().eq('id', id);
    fetchData();
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
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Pelanggan & CRM</h1>
            <p className="text-slate-500 text-sm font-medium">Kelola loyalitas dan data pembeli setia Anda.</p>
          </div>
          <button onClick={() => openModal()} className="ml-auto px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
            <Plus className="w-5 h-5" /> Pelanggan Baru
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-200 w-72">
              <Search className="w-5 h-5 text-slate-400 mr-2" />
              <input type="text" placeholder="Cari nama atau no. HP..." className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400 font-medium" />
            </div>
            <p className="text-sm font-bold text-slate-500">Total: {customers.length} Pelanggan</p>
          </div>

          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider">Nama & Kontak</th>
                <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider">Total Belanja</th>
                <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider">Kunjungan</th>
                <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider">Loyalty Points</th>
                <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-lg font-bold text-slate-600">Belum Ada Pelanggan</p>
                    <p className="text-sm">Klik &quot;Pelanggan Baru&quot; untuk mendaftarkan member pertama.</p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-8">
                      <p className="font-bold text-slate-800 text-base">{c.name}</p>
                      <p className="text-xs font-medium text-slate-400 flex items-center mt-1"><Phone className="w-3 h-3 mr-1" /> {c.phone || '-'}</p>
                    </td>
                    <td className="py-4 px-8 font-black text-slate-800">Rp {Number(c.total_spent || 0).toLocaleString('id-ID')}</td>
                    <td className="py-4 px-8 text-sm font-bold text-slate-500">{c.visits || 0}x</td>
                    <td className="py-4 px-8">
                      <span className="flex items-center font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg w-max border border-emerald-100">
                        <Award className="w-4 h-4 mr-1" /> {c.points || 0} Pts
                      </span>
                    </td>
                    <td className="py-4 px-8 flex justify-end gap-2">
                      <button onClick={() => openModal(c)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"><Edit className="w-5 h-5"/></button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5"/></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800">{editingId ? 'Edit Pelanggan' : 'Daftar Member Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Nama Pelanggan *</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="Misal: Budi Santoso" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Nomor WhatsApp / HP</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="08123456789" />
                <p className="text-[11px] text-slate-400 mt-2">Nomor HP akan digunakan untuk pengiriman poin loyalitas.</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
