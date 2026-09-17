'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Loader2, ArrowLeft, Users, Edit, Trash2, Phone, Award, Ticket, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CRMPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'members' | 'vouchers'>('members');
  const [customers, setCustomers] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [memberForm, setMemberForm] = useState({ id: '', name: '', phone: '' });
  const [voucherForm, setVoucherForm] = useState({
    id: '', code: '', discountType: 'percentage', discountValue: 0, minPurchase: 0, pointCost: 0, validUntil: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const [custRes, vouchRes] = await Promise.all([
      supabase.from('customers').select('*').eq('merchant_id', session.user.id).order('points', { ascending: false }),
      supabase.from('vouchers').select('*').eq('merchant_id', session.user.id).order('created_at', { ascending: false })
    ]);

    if (custRes.data) setCustomers(custRes.data);
    if (vouchRes.data) setVouchers(vouchRes.data);
    setLoading(false);
  };

  const saveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (memberForm.id) {
      await supabase.from('customers').update({ name: memberForm.name, phone: memberForm.phone }).eq('id', memberForm.id);
    } else {
      await supabase.from('customers').insert([{ merchant_id: session!.user.id, name: memberForm.name, phone: memberForm.phone, points: 0, total_spent: 0, visits: 0 }]);
    }
    
    setIsMemberModalOpen(false);
    setIsSubmitting(false);
    fetchData();
  };

  const saveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    const payload = {
      merchant_id: session!.user.id,
      code: voucherForm.code.toUpperCase(),
      discount_type: voucherForm.discountType,
      discount_value: Number(voucherForm.discountValue),
      min_purchase: Number(voucherForm.minPurchase),
      point_cost: Number(voucherForm.pointCost),
      valid_until: voucherForm.validUntil || null,
      is_active: true
    };

    if (voucherForm.id) {
      await supabase.from('vouchers').update(payload).eq('id', voucherForm.id);
    } else {
      await supabase.from('vouchers').insert([payload]);
    }
    
    setIsVoucherModalOpen(false);
    setIsSubmitting(false);
    fetchData();
  };

  const deleteRecord = async (table: string, id: string) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    await supabase.from(table).delete().eq('id', id);
    fetchData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-3 bg-white shadow-sm rounded-xl hover:bg-slate-50 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">CRM & Loyalitas</h1>
              <p className="text-slate-500 font-medium">Kelola pelanggan dan program promo/voucher.</p>
            </div>
          </div>
          <div className="flex bg-white rounded-xl shadow-sm p-1">
            <button onClick={() => setTab('members')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'members' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>Member</button>
            <button onClick={() => setTab('vouchers')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'vouchers' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>Voucher</button>
          </div>
        </div>

        {tab === 'members' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Daftar Member</h2>
              <button onClick={() => { setMemberForm({id:'', name:'', phone:''}); setIsMemberModalOpen(true); }} className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                <Plus className="w-5 h-5" /> Member Baru
              </button>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="py-4 px-8 font-bold text-slate-600 text-sm">PELANGGAN</th>
                  <th className="py-4 px-8 font-bold text-slate-600 text-sm">TOTAL BELANJA</th>
                  <th className="py-4 px-8 font-bold text-slate-600 text-sm">POIN</th>
                  <th className="py-4 px-8 font-bold text-slate-600 text-sm text-right">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} className="border-b border-slate-50">
                    <td className="py-4 px-8">
                      <p className="font-bold text-slate-800 text-base">{c.name}</p>
                      <p className="text-xs font-medium text-slate-400 flex items-center mt-1"><Phone className="w-3 h-3 mr-1" /> {c.phone || '-'}</p>
                    </td>
                    <td className="py-4 px-8 font-black text-slate-800">Rp {Number(c.total_spent || 0).toLocaleString('id-ID')}</td>
                    <td className="py-4 px-8">
                      <span className="flex items-center font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg w-max border border-amber-100"><Award className="w-4 h-4 mr-1" /> {c.points || 0}</span>
                    </td>
                    <td className="py-4 px-8 flex justify-end gap-2">
                      <button onClick={() => { setMemberForm({id:c.id, name:c.name, phone:c.phone}); setIsMemberModalOpen(true); }} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg"><Edit className="w-5 h-5"/></button>
                      <button onClick={() => deleteRecord('customers', c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'vouchers' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Katalog Voucher Promo</h2>
              <button onClick={() => { setVoucherForm({id:'', code:'', discountType:'percentage', discountValue:0, minPurchase:0, pointCost:0, validUntil:''}); setIsVoucherModalOpen(true); }} className="px-6 py-3 bg-rose-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-rose-700 shadow-lg shadow-rose-500/20">
                <Plus className="w-5 h-5" /> Voucher Baru
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {vouchers.map(v => (
                <div key={v.id} className="border border-slate-200 rounded-2xl p-5 relative overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="absolute top-0 right-0 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-bl-xl">
                    {v.pointCost > 0 ? `${v.pointCost} Poin` : 'GRATIS'}
                  </div>
                  <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 mb-4"><Ticket className="w-6 h-6" /></div>
                  <h3 className="font-black text-2xl text-slate-800 mb-1">{v.code}</h3>
                  <p className="font-bold text-rose-600 mb-4">Diskon {v.discount_type === 'percentage' ? `${v.discount_value}%` : `Rp ${v.discount_value.toLocaleString()}`}</p>
                  <div className="text-sm font-medium text-slate-500 space-y-1 mb-6">
                    <p>Min. Belanja: Rp {v.min_purchase.toLocaleString()}</p>
                    <p>Berlaku s/d: {v.valid_until ? new Date(v.valid_until).toLocaleDateString('id-ID') : 'Tanpa Batas'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => deleteRecord('vouchers', v.id)} className="flex-1 py-2 bg-red-50 text-red-600 font-bold rounded-xl text-sm hover:bg-red-100">Hapus</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between"><h2 className="text-xl font-black">{memberForm.id ? 'Edit Member' : 'Member Baru'}</h2><button onClick={() => setIsMemberModalOpen(false)}><X className="w-5 h-5"/></button></div>
            <form onSubmit={saveMember} className="p-8 space-y-4">
              <div><label className="block text-xs font-bold text-slate-600 mb-2">NAMA</label><input required type="text" value={memberForm.name} onChange={e=>setMemberForm({...memberForm, name:e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-2">NO HP</label><input type="text" value={memberForm.phone} onChange={e=>setMemberForm({...memberForm, phone:e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl" /></div>
              <button disabled={isSubmitting} type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">Simpan Member</button>
            </form>
          </div>
        </div>
      )}

      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between"><h2 className="text-xl font-black">{voucherForm.id ? 'Edit Voucher' : 'Voucher Baru'}</h2><button onClick={() => setIsVoucherModalOpen(false)}><X className="w-5 h-5"/></button></div>
            <form onSubmit={saveVoucher} className="p-8 space-y-4">
              <div><label className="block text-xs font-bold text-slate-600 mb-2">KODE VOUCHER</label><input required type="text" value={voucherForm.code} onChange={e=>setVoucherForm({...voucherForm, code:e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl uppercase" /></div>
              <div className="flex gap-4">
                <div className="flex-1"><label className="block text-xs font-bold text-slate-600 mb-2">TIPE DISKON</label><select value={voucherForm.discountType} onChange={e=>setVoucherForm({...voucherForm, discountType:e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl"><option value="percentage">Persen (%)</option><option value="fixed">Nominal (Rp)</option></select></div>
                <div className="flex-1"><label className="block text-xs font-bold text-slate-600 mb-2">NILAI DISKON</label><input required type="number" value={voucherForm.discountValue} onChange={e=>setVoucherForm({...voucherForm, discountValue:Number(e.target.value)})} className="w-full p-3 bg-slate-50 border rounded-xl" /></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-600 mb-2">MINIMAL BELANJA (Rp)</label><input required type="number" value={voucherForm.minPurchase} onChange={e=>setVoucherForm({...voucherForm, minPurchase:Number(e.target.value)})} className="w-full p-3 bg-slate-50 border rounded-xl" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-2">HARGA POIN (Isi 0 jika Gratis)</label><input required type="number" value={voucherForm.pointCost} onChange={e=>setVoucherForm({...voucherForm, pointCost:Number(e.target.value)})} className="w-full p-3 bg-slate-50 border rounded-xl" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-2">BERLAKU SAMPAI (Opsional)</label><input type="date" value={voucherForm.validUntil} onChange={e=>setVoucherForm({...voucherForm, validUntil:e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl" /></div>
              <button disabled={isSubmitting} type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-4">Simpan Voucher</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
