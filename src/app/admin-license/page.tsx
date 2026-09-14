'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Crown, KeyRound, CheckCircle, Copy, Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLicensePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [tier, setTier] = useState('pro');
  const [duration, setDuration] = useState('30');
  const [quantity, setQuantity] = useState('1');
  const [campaign, setCampaign] = useState('PROMO_AWAL');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'POCKID2026') {
      setIsAuthenticated(true);
    } else {
      alert('Password Salah!');
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${tier.toUpperCase().substring(0,3)}-${code.substring(0,4)}-${code.substring(4)}`;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('Anda harus login ke SuperWeb terlebih dahulu!');
      setIsGenerating(false);
      return;
    }

    const qty = parseInt(quantity) || 1;
    const dur = duration === 'permanent' ? null : parseInt(duration);
    
    const newCodes = [];
    for (let i = 0; i < qty; i++) {
      newCodes.push({
        code: generateRandomCode(),
        tier: tier,
        duration_days: dur,
        campaign_name: campaign,
        is_used: false
      });
    }

    const { error } = await supabase.from('redeem_codes').insert(newCodes);
    
    if (error) {
      alert('Gagal membuat kode: ' + error.message);
    } else {
      setGeneratedCodes(newCodes.map(c => c.code));
    }
    
    setIsGenerating(false);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(generatedCodes.join('\n'));
    alert('Kode berhasil disalin!');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm space-y-6">
          <div className="flex justify-center"><KeyRound className="w-12 h-12 text-indigo-600" /></div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-800">Developer Access</h1>
            <p className="text-sm text-slate-500">Masukkan Password Rahasia</p>
          </div>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Password..." />
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Masuk</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
              <Crown className="w-8 h-8 text-amber-500" /> License Generator
            </h1>
            <p className="text-slate-500 font-medium">Buat kode tebus (Redeem Codes) untuk pelanggan.</p>
          </div>
          <button onClick={() => router.push('/settings')} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50">
            <LogOut className="w-4 h-4" /> Kembali
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <form onSubmit={handleGenerate} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Paket (Tier)</label>
              <select value={tier} onChange={e=>setTier(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <option value="pro">Pro (Rp 150.000)</option>
                <option value="enterprise">Enterprise (SaaS)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Masa Aktif</label>
              <select value={duration} onChange={e=>setDuration(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <option value="30">30 Hari (Sebulan)</option>
                <option value="365">365 Hari (Setahun)</option>
                <option value="permanent">Permanen (Seumur Hidup)</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Jumlah Kode</label>
                <input type="number" min="1" max="100" value={quantity} onChange={e=>setQuantity(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Nama Kampanye</label>
                <input type="text" value={campaign} onChange={e=>setCampaign(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="PROMO_2026" />
              </div>
            </div>

            <button type="submit" disabled={isGenerating} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-indigo-700">
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Kode Sekarang'}
            </button>
          </form>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> Hasil Generate</h3>
              {generatedCodes.length > 0 && (
                <button type="button" onClick={copyAll} className="text-sm font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800">
                  <Copy className="w-4 h-4" /> Copy Semua
                </button>
              )}
            </div>
            
            <div className="flex-1 bg-slate-900 rounded-xl p-4 overflow-y-auto font-mono text-emerald-400 text-sm h-[300px]">
              {generatedCodes.length === 0 ? (
                <p className="text-slate-500 text-center mt-10">Belum ada kode yang digenerate.</p>
              ) : (
                generatedCodes.map((c, i) => <div key={i}>{c}</div>)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
