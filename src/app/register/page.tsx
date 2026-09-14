'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, Store, User, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const [formData, setFormData] = useState({
    ownerName: '',
    storeName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Kata sandi dan Konfirmasi Kata Sandi tidak cocok!');
      return;
    }

    setLoading(true);
    
    // 1. Daftar ke Supabase Auth (Membuat Super Akun)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError) {
      alert('Pendaftaran gagal: ' + authError.message);
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;
    
    if (userId) {
      // 2. Simpan Profil Toko ke tabel merchants/branches agar bisa disinkronkan ke Aplikasi
      const { error: dbError } = await supabase.from('branches').insert({
        merchant_id: userId,
        name: formData.storeName,
        address: 'Pusat' // Default
      });
      
      if (dbError) {
        console.error("Gagal menyimpan data toko:", dbError);
      }
      
      alert('Pendaftaran Super Akun Berhasil! Anda sekarang dilindungi oleh Enkripsi Cloud. Silakan Masuk (Login).');
      router.push('/login');
    }
    
    setLoading(false);
  };

  const handleOAuth = async (provider: 'google' | 'apple' | 'facebook') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/login'
      }
    });
    if (error) alert(error.message);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Security Pattern */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      
      <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl p-8 border-t-4 border-indigo-500 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Registrasi Super Akun</h1>
          <p className="text-slate-500 text-sm mt-2">Daftarkan bisnis F&B Anda ke ekosistem PockidPOS Cloud (Enkripsi SSL/TLS 256-bit)</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pemilik</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={formData.ownerName}
                  onChange={e => setFormData({...formData, ownerName: e.target.value})}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                  placeholder="Budi Santoso"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kedai/Bisnis</label>
              <div className="relative">
                <Store className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={formData.storeName}
                  onChange={e => setFormData({...formData, storeName: e.target.value})}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                  placeholder="Kopi Kenangan"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Super Admin</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                placeholder="admin@bisnisanda.com"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                  placeholder="Min. 6 Karakter"
                  minLength={6}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Konfirmasi Kata Sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password" 
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                  placeholder="Ulangi Sandi"
                  minLength={6}
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? 'Memproses Enkripsi...' : <><ShieldCheck className="w-5 h-5" /> Buat Super Akun (Aman)</>}
            </button>
          </div>
        </form>

        <div className="relative mt-6 mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500 font-bold">ATAU DAFTAR CEPAT DENGAN</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button type="button" onClick={() => handleOAuth('google')} className="flex items-center justify-center py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          </button>
          <button type="button" onClick={() => handleOAuth('apple')} className="flex items-center justify-center py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors bg-slate-900 hover:bg-slate-800">
            <img src="https://www.svgrepo.com/show/511330/apple-173.svg" className="w-5 h-5 invert" alt="Apple" />
          </button>
          <button type="button" onClick={() => handleOAuth('facebook')} className="flex items-center justify-center py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors bg-[#1877F2] hover:bg-[#166fe5]">
            <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="w-5 h-5 brightness-0 invert" alt="Facebook" />
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6 font-medium">
          Sudah memiliki Super Akun?{' '}
          <Link href="/login" className="text-indigo-600 font-bold hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
