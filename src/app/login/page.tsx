'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple' | 'facebook') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/'
      }
    });
    if (error) alert(error.message);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl p-8 border border-slate-100 relative">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Admin Login</h1>
          <p className="text-slate-500 text-sm mt-2">PockidPOS SuperWeb Control Panel</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email Administrator</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium"
                placeholder="admin@pockidpos.com"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Kata Sandi</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg mt-2 flex items-center justify-center gap-2"
          >
            {loading ? 'Memverifikasi...' : <><ShieldCheck className="w-5 h-5" /> Masuk ke SuperWeb</>}
          </button>
        </form>

        <div className="relative mt-6 mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500 font-bold">ATAU MASUK DENGAN</span>
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
          Belum memiliki Super Akun?{' '}
          <Link href="/register" className="text-indigo-600 font-bold hover:underline">
            Daftar Merchant Baru
          </Link>
        </p>
      </div>
    </div>
  );
}
