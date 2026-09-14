'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Save, Store, MapPin, Receipt, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    tax_rate: '0',
    receipt_footer: ''
  });

  const router = useRouter();

  useEffect(() => {
    fetchStoreProfile();
  }, []);

  const fetchStoreProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const { data } = await supabase.from('branches').select('*').eq('merchant_id', session.user.id).single();
    if (data) {
      setStoreId(data.id);
      setFormData({
        name: data.name || '',
        address: data.address || '',
        tax_rate: '0', // Nanti ditambahkan ke tabel branches jika butuh
        receipt_footer: 'Terima kasih telah berbelanja!'
      });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !storeId) return;

    await supabase.from('branches').update({
      name: formData.name,
      address: formData.address,
    }).eq('id', storeId);

    setIsSaving(false);
    alert('Pengaturan Toko Berhasil Disimpan!');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
          <Link href="/" className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Pengaturan Toko</h1>
            <p className="text-slate-500 text-sm font-medium">Ubah informasi cabang, pajak, dan detail struk belanja.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="p-8 space-y-8">
            
            {/* Profil Toko */}
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-800 mb-6 border-b border-slate-100 pb-4">
                <Store className="w-5 h-5 text-indigo-500" /> Informasi Dasar
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Nama Toko *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Alamat Lengkap</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                  </div>
                </div>
              </div>
            </div>

            {/* Pengaturan Pajak & Struk */}
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-800 mb-6 border-b border-slate-100 pb-4">
                <Receipt className="w-5 h-5 text-indigo-500" /> Keuangan & Struk
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Pajak (PPN) %</label>
                  <input type="number" value={formData.tax_rate} onChange={e => setFormData({...formData, tax_rate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Catatan Kaki Struk</label>
                  <input type="text" value={formData.receipt_footer} onChange={e => setFormData({...formData, receipt_footer: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-4 items-start">
              <ShieldCheck className="w-6 h-6 text-indigo-500 shrink-0" />
              <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                Pengaturan ini akan langsung tersinkronisasi ke seluruh aplikasi mesin kasir (HP/Tablet) yang terhubung ke akun SuperWeb Anda secara Real-Time.
              </p>
            </div>

          </div>
          
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
            <button type="submit" disabled={isSaving} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 active:scale-95 transition-all">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Simpan Pengaturan</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
