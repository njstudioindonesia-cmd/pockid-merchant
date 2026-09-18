'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Loader2, ArrowLeft, Save, Store, MapPin, Receipt, ShieldCheck, 
  Users, CreditCard, ShoppingBag, Lock, Crown, Printer, Trash2, Plus, Edit, X
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profil');
  
  // Data State
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({ id: '', name: '', address: '' });
  const [hpSettings, setHpSettings] = useState<any>({});
  
  const [redeemInput, setRedeemInput] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  
  // Form Profil & Struk
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    tax_rate: '0',
    receipt_footer: ''
  });

  // Modal Karyawan
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isSubmittingEmp, setIsSubmittingEmp] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [empForm, setEmpForm] = useState({ name: '', phone: '', salary: '0', address: '', role: 'cashier', pin: '' });

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

    // Ambil Data Cabang Pusat
    const { data: branchData } = await supabase.from('branches').select('*').eq('merchant_id', session.user.id);
    if (branchData && branchData.length > 0) {
        setBranches(branchData);
        setStoreId(branchData[0].id);
        setFormData({
          name: branchData[0].name || '',
          address: branchData[0].address || '',
          tax_rate: '0',
          receipt_footer: 'Terima kasih telah berbelanja!'
        });
      }

    // Ambil Karyawan
    const { data: empData } = await supabase.from('employees').select('*').eq('merchant_id', session.user.id).order('created_at', { ascending: false });
    if (empData) setEmployees(empData);

    // Ambil Pengaturan HP
    const { data: setData } = await supabase.from('merchant_settings').select('settings').eq('merchant_id', session.user.id).single();
    if (setData && setData.settings) {
      setHpSettings(setData.settings);
      if (setData.settings.storeName) {
        setFormData(prev => ({ 
          ...prev, 
          name: setData.settings.storeName,
          address: setData.settings.storeAddress || prev.address,
          tax_rate: setData.settings.taxRate?.toString() || prev.tax_rate,
          receipt_footer: setData.settings.footerMessage || prev.receipt_footer
        }));
      }
    }

    setLoading(false);
  };

  const handleRedeem = async () => {
    if (!redeemInput) return;
    setIsRedeeming(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');

      // Check code
      const { data: codeData, error: fetchErr } = await supabase
        .from('redeem_codes')
        .select('*')
        .eq('code', redeemInput)
        .single();
        
      if (fetchErr || !codeData) {
        alert('Kode tidak valid atau tidak ditemukan!');
        setIsRedeeming(false);
        return;
      }
      
      if (codeData.is_used) {
        alert('Kode ini sudah digunakan!');
        setIsRedeeming(false);
        return;
      }

      // Claim code
      const { error: claimErr } = await supabase
        .from('redeem_codes')
        .update({ 
          is_used: true, 
          used_by: session.user.id, 
          used_at: new Date().toISOString() 
        })
        .eq('code', redeemInput);

      if (claimErr) throw claimErr;

      // Update merchant_settings
      const newExp = codeData.duration_days 
        ? Date.now() + (codeData.duration_days * 24 * 60 * 60 * 1000) 
        : null;

      const updatedSettings = {
        ...hpSettings,
        isPro: true,
        proType: codeData.tier,
        trialExpiresAt: newExp
      };

      await supabase.from('merchant_settings').upsert({
        merchant_id: session.user.id,
        settings: updatedSettings
      }, { onConflict: 'merchant_id' });

      setHpSettings(updatedSettings);
      setRedeemInput('');
      alert(`Berhasil! Lisensi ${codeData.tier.toUpperCase()} telah diaktifkan.`);
      
    } catch (e: any) {
      alert('Terjadi kesalahan: ' + e.message);
    }
    
    setIsRedeeming(false);
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

    if (hpSettings) {
      const updatedHpSettings = {
        ...hpSettings,
        storeName: formData.name,
        storeAddress: formData.address,
        taxRate: Number(formData.tax_rate),
        footerMessage: formData.receipt_footer
      };
      await supabase.from('merchant_settings').upsert({
        merchant_id: session.user.id,
        settings: updatedHpSettings
      }, { onConflict: 'merchant_id' });
    }

    setIsSaving(false);
    alert('Pengaturan Toko Tersimpan!');
  };

  // --- FUNGSI KARYAWAN ---
  const openEmpModal = (emp: any = null) => {
    if (emp) {
      setEditingEmpId(emp.id);
      setEmpForm({ 
        name: emp.name, 
        phone: emp.phone || '', 
        salary: emp.salary?.toString() || '0', 
        address: emp.address || '',
        role: emp.role || 'cashier',
        pin: emp.pin || ''
      });
    } else {
      setEditingEmpId(null);
      setEmpForm({ name: '', phone: '', salary: '0', address: '', role: 'cashier', pin: '' });
    }
    setIsEmpModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingEmp(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // QUOTA CHECK
    if (!editingEmpId) {
      const isPro = hpSettings?.isPro;
      const proType = hpSettings?.proType || 'basic';
      
      const maxEmployees = proType === 'basic' ? 1 : (proType === 'pro' || proType === 'trial' ? 5 : 9999);
      
      if (employees.length >= maxEmployees) {
        alert(`Batas maksimal karyawan tercapai! Paket ${proType.toUpperCase()} mengizinkan maksimal ${maxEmployees} karyawan. Silakan upgrade ke paket lebih tinggi.`);
        setIsSubmittingEmp(false);
        return;
      }
    }

    const payload = {
      merchant_id: session.user.id,
      name: empForm.name,
      phone: empForm.phone,
      salary: Number(empForm.salary),
      address: empForm.address,
      role: empForm.role,
      pin: empForm.pin
    };

    if (editingEmpId) {
      await supabase.from('employees').update(payload).eq('id', editingEmpId);
    } else {
      await supabase.from('employees').insert([{ ...payload, id: `emp-${Date.now()}` }]);
    }

    setIsEmpModalOpen(false);
    setIsSubmittingEmp(false);
    fetchStoreProfile(); // Refresh
  };

  
  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    if (branchForm.id) {
      await supabase.from('branches').update({ name: branchForm.name, address: branchForm.address }).eq('id', branchForm.id);
    } else {
      await supabase.from('branches').insert({ merchant_id: session.user.id, name: branchForm.name, address: branchForm.address });
    }
    
    setIsBranchModalOpen(false);
    fetchStoreProfile();
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm('Hapus cabang ini? Transaksi yang terkait mungkin kehilangan referensi cabangnya.')) return;
    await supabase.from('branches').delete().eq('id', id);
    fetchStoreProfile();
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Hapus karyawan ini secara permanen?')) return;
    await supabase.from('employees').delete().eq('id', id);
    fetchStoreProfile();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

  const tabs = [
      { id: 'profil', label: 'Profil Toko', icon: Store, desc: 'Nama & Alamat Cabang' },
      { id: 'struk', label: 'Struk & Kasir', icon: Receipt, desc: 'Pajak & Catatan Struk' },
      { id: 'cabang', label: 'Manajemen Cabang', icon: Store, desc: 'Multi-outlet', enterpriseOnly: true },
      { id: 'karyawan', label: 'Karyawan', icon: Users, desc: 'Hak akses kasir' },
      { id: 'pembayaran', label: 'Pembayaran', icon: CreditCard, desc: 'Tunai, QRIS, Transfer' },
      { id: 'online', label: 'Toko Online', icon: ShoppingBag, desc: 'Katalog Digital' },
      { id: 'keamanan', label: 'Keamanan & Backup', icon: Lock, desc: 'Keamanan Data Cloud' },
      { id: 'lisensi', label: 'Lisensi PRO', icon: Crown, desc: 'Berlangganan Sistem' },
    ].filter(t => !t.enterpriseOnly || hpSettings?.proType === 'enterprise');

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
          {(activeTab !== 'karyawan' && activeTab !== 'lisensi') && (
            <button onClick={handleSave} disabled={isSaving} className="ml-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 active:scale-95 transition-all">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Simpan Perubahan</>}
            </button>
          )}
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

              
              {activeTab === 'cabang' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                    <div>
                      <h2 className="text-xl font-black text-slate-800">Manajemen Cabang Enterprise</h2>
                      <p className="text-sm text-slate-500 font-medium">Atur cabang untuk mengelompokkan transaksi kasir.</p>
                    </div>
                    <button onClick={() => { setBranchForm({id: '', name: '', address: ''}); setIsBranchModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Tambah Cabang</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {branches.map(b => (
                      <div key={b.id} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-slate-800 text-lg">{b.name}</h3>
                          <div className="flex gap-2">
                            <button onClick={() => { setBranchForm({id: b.id, name: b.name, address: b.address || ''}); setIsBranchModalOpen(true); }} className="text-blue-500 hover:text-blue-700"><Edit className="w-4 h-4"/></button>
                            {branches.length > 1 && <button onClick={() => handleDeleteBranch(b.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4"/></button>}
                          </div>
                        </div>
                        <p className="text-sm text-slate-500 flex-1">{b.address || 'Tidak ada alamat'}</p>
                        <p className="text-xs font-mono text-slate-400 bg-slate-100 p-1.5 rounded truncate" title={b.id}>ID: {b.id}</p>
                      </div>
                    ))}
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
                </div>
              )}

              {activeTab === 'karyawan' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-black text-slate-800">Manajemen Karyawan</h2>
                      <p className="text-sm text-slate-500 font-medium mt-1">Data tersinkron otomatis 2 arah dengan HP Kasir.</p>
                    </div>
                    <button onClick={() => openEmpModal()} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-sm active:scale-95 transition-all text-sm">
                      <Plus className="w-4 h-4" /> Tambah Staf
                    </button>
                  </div>
                  
                  {employees.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="font-bold text-slate-600 text-lg">Belum Ada Karyawan</p>
                      <p className="text-sm text-slate-500">Silakan tambahkan Karyawan pertama Anda.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {employees.map(emp => (
                        <div key={emp.id} className="border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-indigo-300 transition-colors bg-slate-50/50">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold flex-shrink-0">
                              {emp.photo ? <img src={emp.photo} alt={emp.name} className="w-full h-full rounded-full object-cover" /> : emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800 flex items-center gap-2">{emp.name} <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Kasir</span></h3>
                              <p className="text-xs text-slate-500 font-medium">{emp.phone || 'No. HP Kosong'} • Gaji: Rp {Number(emp.salary || 0).toLocaleString('id-ID')}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openEmpModal(emp)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"><Edit className="w-5 h-5"/></button>
                            <button onClick={() => handleDeleteEmployee(emp.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5"/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'pembayaran' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="border-b border-slate-100 pb-4 mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Metode Pembayaran & QRIS</h2>
                    <p className="text-sm text-slate-500 font-medium">Atur cara pelanggan membayar di kasir Anda.</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Gambar Barcode QRIS (Base64)</label>
                      <textarea rows={4} value={hpSettings?.qrisImage || ''} onChange={e => setHpSettings({...hpSettings, qrisImage: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-indigo-500" placeholder="Paste data:image/png;base64,... di sini" />
                      <p className="text-xs text-slate-500 mt-2">Gambar QRIS ini akan muncul di layar struk digital HP Kasir untuk di-scan pelanggan.</p>
                    </div>
                    
                    {hpSettings?.qrisImage && hpSettings.qrisImage.startsWith('data:image') && (
                      <div className="p-4 bg-white border border-slate-200 rounded-xl max-w-[200px]">
                        <img src={hpSettings.qrisImage} alt="QRIS" className="w-full h-auto rounded-lg" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'online' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="border-b border-slate-100 pb-4 mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Toko Online & Katalog</h2>
                    <p className="text-sm text-slate-500 font-medium">Atur visibilitas toko Anda di internet.</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Aktifkan Katalog Digital</h4>
                        <p className="text-xs text-slate-500 font-medium">Pelanggan dapat melihat menu/produk Anda via link browser.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={hpSettings?.isStorePublished || false} onChange={e => setHpSettings({...hpSettings, isStorePublished: e.target.checked})} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Model Bisnis (UI Kasir)</label>
                      <select value={hpSettings?.businessMode || 'retail'} onChange={e => setHpSettings({...hpSettings, businessMode: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-indigo-500">
                        <option value="retail">Retail / Minimarket (Scan Barcode & Grid)</option>
                        <option value="fnb">F&B / Restoran (Meja & Pesanan Dapur)</option>
                        <option value="services">Jasa / Salon (Booking Waktu)</option>
                      </select>
                      <p className="text-xs text-slate-500 mt-2">Mengubah ini akan merombak total tampilan UI di Aplikasi HP Kasir secara otomatis (membutuhkan restart aplikasi HP).</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'keamanan' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="border-b border-slate-100 pb-4 mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Keamanan & Kontrol Akses</h2>
                    <p className="text-sm text-slate-500 font-medium">Lindungi data penjualan dan cegah manipulasi kasir.</p>
                  </div>
                  
                  <div className="space-y-6 max-w-sm">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">PIN Master Admin (HP Kasir)</label>
                      <input type="password" maxLength={6} value={hpSettings?.adminPin || ''} onChange={e => setHpSettings({...hpSettings, adminPin: e.target.value.replace(/[^0-9]/g, '')})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold tracking-widest focus:bg-white focus:outline-none focus:border-indigo-500" placeholder="1234" />
                      <p className="text-xs text-slate-500 mt-2">PIN ini diperlukan di HP Kasir untuk masuk ke mode Admin, menghapus transaksi, atau mereset data.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'lisensi' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="border-b border-slate-100 pb-4 mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Status Lisensi PRO</h2>
                    <p className="text-sm text-slate-500 font-medium">Informasi paket berlangganan SuperWeb & App Anda.</p>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl shadow-xl shadow-indigo-900/20 text-white relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 opacity-10">
                      <Crown className="w-48 h-48" />
                    </div>
                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-bold mb-4 border border-amber-400/30">
                        <Crown className="w-3 h-3" />
                        {(() => {
                          const isTrial = hpSettings?.trialExpiresAt && hpSettings.trialExpiresAt > Date.now();
                          if (hpSettings?.proType === 'enterprise') return isTrial ? 'ENTERPRISE (TRIAL)' : 'ENTERPRISE PLAN';
                          if (hpSettings?.isPro || hpSettings?.proType === 'pro') return isTrial ? 'PRO (TRIAL)' : 'PRO PLAN';
                          return 'BASIC PLAN';
                        })()}
                      </div>
                      <h3 className="text-2xl font-black mb-1">
                        {hpSettings?.proType === 'enterprise' ? 'PockidPOS Enterprise' : hpSettings?.isPro ? 'PockidPOS Pro' : 'PockidPOS Basic'}
                      </h3>
                      <p className="text-indigo-200 text-sm mb-6 max-w-md">Nikmati sinkronisasi 2 arah tanpa batas, manajemen ERP lengkap, dan dukungan prioritas 24/7.</p>
                      
                      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-indigo-500/30">
                        <div>
                          <p className="text-xs text-indigo-300 font-bold mb-1">STATUS AKUN</p>
                          <p className="font-medium text-white">{hpSettings?.isPro ? 'Premium' : 'Gratis'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-indigo-300 font-bold mb-1">MASA BERLAKU</p>
                          <p className="font-medium text-white">
                            {hpSettings?.trialExpiresAt 
                              ? new Date(hpSettings.trialExpiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) 
                              : 'Selamanya (Permanent)'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Redeem Code */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-2">Punya Kode Aktivasi?</h3>
                    <p className="text-sm text-slate-500 mb-4">Masukkan kode unik (Redeem Code) untuk membuka fitur premium.</p>
                    
                    <div className="flex gap-2">
                      <input type="text" value={redeemInput} onChange={(e) => setRedeemInput(e.target.value.toUpperCase())} placeholder="PRO-XXXX-XXXX" className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm tracking-widest focus:bg-white focus:outline-none focus:border-indigo-500" />
                      <button onClick={handleRedeem} disabled={isRedeeming || !redeemInput} className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 disabled:opacity-50 flex items-center gap-2">
                        {isRedeeming ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Aktifkan'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Modal Tambah/Edit Karyawan */}
      
        {isBranchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-xl font-black text-slate-800">{branchForm.id ? 'Edit Cabang' : 'Tambah Cabang'}</h2>
                <button onClick={() => setIsBranchModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleSaveBranch} className="p-8 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Nama Cabang</label>
                  <input type="text" required value={branchForm.name} onChange={e => setBranchForm({...branchForm, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Alamat</label>
                  <textarea value={branchForm.address} onChange={e => setBranchForm({...branchForm, address: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"></textarea>
                </div>
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700">Simpan Cabang</button>
              </form>
            </div>
          </div>
        )}

        {isEmpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800">{editingEmpId ? 'Edit Karyawan' : 'Tambah Staf Baru'}</h2>
              <button onClick={() => setIsEmpModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSaveEmployee} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Nama Lengkap *</label>
                <input type="text" required value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-indigo-500" placeholder="Misal: Rian" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Peran (Role)</label>
                  <select value={empForm.role} onChange={e => setEmpForm({...empForm, role: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-indigo-500">
                    <option value="cashier">Kasir (Akses Terbatas)</option>
                    <option value="admin">Admin (Akses Penuh)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">PIN Akses (4 Angka)</label>
                  <input type="text" maxLength={4} required value={empForm.pin} onChange={e => setEmpForm({...empForm, pin: e.target.value.replace(/[^0-9]/g, '')})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold tracking-widest focus:bg-white focus:outline-none focus:border-indigo-500" placeholder="1234" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Nomor HP</label>
                <input type="text" value={empForm.phone} onChange={e => setEmpForm({...empForm, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-indigo-500" placeholder="08..." />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Gaji Bulanan</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                  <input type="number" value={empForm.salary} onChange={e => setEmpForm({...empForm, salary: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEmpModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
                <button type="submit" disabled={isSubmittingEmp} className="px-8 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2">
                  {isSubmittingEmp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Karyawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
