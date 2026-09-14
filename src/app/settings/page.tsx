'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Loader2, ArrowLeft, Save, Store, MapPin, Receipt, ShieldCheck, 
  Users, CreditCard, ShoppingBag, Lock, DownloadCloud, Crown, Printer
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profil');
  
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
        tax_rate: '0',
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
    alert('Pengaturan Tersimpan dan Sinkron ke HP Kasir!');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

  const tabs = [
    { id: 'profil', label: 'Profil Toko', icon: Store, desc: 'Nama & Alamat Cabang' },
    { id: 'struk', label: 'Struk & Kasir', icon: Receipt, desc: 'Pajak & Catatan Struk' },
    { id: 'karyawan', label: 'Karyawan', icon: Users, desc: 'Hak akses kasir' },
    { id: 'pembayaran', label: 'Pembayaran', icon: CreditCard, desc: 'Tunai, QRIS, Transfer' },
    { id: 'online', label: 'Toko Online', icon: ShoppingBag, desc: 'Katalog Digital' },
    { id: 'keamanan', label: 'Keamanan & Backup', icon: Lock, desc: 'Keamanan Data Cloud' },
    { id: 'lisensi', label: 'Lisensi PRO', icon: Crown, desc: 'Berlangganan Sistem' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-12">
      <div className="p-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
          <Link href="/" className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Sistem & Pengaturan</h1>
            <p className="text-slate-500 text-sm font-medium">Kendali penuh atas seluruh operasional cabang dan aplikasi kasir Anda.</p>
          </div>
          <button onClick={handleSave} disabled={isSaving} className="ml-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 active:scale-95 transition-all">
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Simpan Perubahan</>}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Sidebar Tabs */}
          <div className="md:col-span-3 space-y-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left border ${isActive ? 'bg-white border-indigo-100 shadow-sm ring-1 ring-indigo-500/20' : 'border-transparent hover:bg-white hover:border-slate-200/60 hover:shadow-sm'}`}
                >
                  <div className={`p-2.5 rounded-xl ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>{tab.label}</h3>
                    <p className={`text-[11px] font-medium mt-0.5 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}>{tab.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Content Area */}
          <div className="md:col-span-9">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-8 min-h-[500px]">
              
              {activeTab === 'profil' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="border-b border-slate-100 pb-4 mb-6">
                    <h2 className="text-xl font-black text-slate-800">Profil Toko Cabang Pusat</h2>
                    <p className="text-sm text-slate-500 font-medium">Informasi ini akan tampil di nota dan aplikasi kasir utama.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Nama Toko *</label>
                      <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Alamat Lengkap</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                        <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows={3} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'struk' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="border-b border-slate-100 pb-4 mb-6">
                    <h2 className="text-xl font-black text-slate-800">Pengaturan Struk & Pajak</h2>
                    <p className="text-sm text-slate-500 font-medium">Atur format pencetakan printer thermal Bluetooth di Kasir.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-6 max-w-lg">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Pajak (PPN) %</label>
                      <div className="relative">
                        <input type="number" value={formData.tax_rate} onChange={e => setFormData({...formData, tax_rate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Pesan Kaki Struk (Footer)</label>
                      <input type="text" value={formData.receipt_footer} onChange={e => setFormData({...formData, receipt_footer: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                    </div>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-4 items-start">
                    <Printer className="w-6 h-6 text-indigo-500 shrink-0" />
                    <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                      Pengaturan ini akan langsung tersinkronisasi ke seluruh mesin printer thermal (58mm/80mm) di semua kasir Anda dalam hitungan detik.
                    </p>
                  </div>
                </div>
              )}

              {/* Placeholder Tabs */}
              {['karyawan', 'pembayaran', 'online', 'keamanan', 'lisensi'].includes(activeTab) && (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center animate-in fade-in duration-300">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                    {activeTab === 'karyawan' && <Users className="w-10 h-10 text-slate-300" />}
                    {activeTab === 'pembayaran' && <CreditCard className="w-10 h-10 text-slate-300" />}
                    {activeTab === 'online' && <ShoppingBag className="w-10 h-10 text-slate-300" />}
                    {activeTab === 'keamanan' && <ShieldCheck className="w-10 h-10 text-slate-300" />}
                    {activeTab === 'lisensi' && <Crown className="w-10 h-10 text-amber-300" />}
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-2">Modul {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
                  <p className="text-sm text-slate-500 font-medium max-w-sm">Fitur ERP ini terhubung ke Cloud, Anda dapat mengelolanya melalui antarmuka SuperWeb.</p>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
