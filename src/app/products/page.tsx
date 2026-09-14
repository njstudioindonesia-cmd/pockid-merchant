'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Plus, Package, Edit, Trash2, Loader2, ArrowLeft, Search, X, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    capital_price: '',
    stock: '',
    barcode: '',
    category_id: '',
    is_flexible_price: false,
    image: ''
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

    // Ambil Produk
    const { data: prodData } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('merchant_id', session.user.id)
      .order('created_at', { ascending: false });

    // Ambil Kategori
    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .eq('merchant_id', session.user.id);

    if (prodData) setProducts(prodData);
    if (catData) setCategories(catData);
    
    setLoading(false);
  };

  const openModal = (product: any = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        price: product.price?.toString() || '0',
        capital_price: product.capital_price?.toString() || '0',
        stock: product.stock?.toString() || '0',
        barcode: product.barcode || '',
        category_id: product.category_id || '',
        is_flexible_price: product.is_flexible_price || false,
        image: product.image || ''
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', price: '', capital_price: '0', stock: '0', barcode: '', category_id: '', is_flexible_price: false, image: '' });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const payload = {
      merchant_id: session.user.id,
      name: formData.name,
      price: formData.is_flexible_price ? 0 : Number(formData.price),
      capital_price: Number(formData.capital_price),
      stock: Number(formData.stock),
      barcode: formData.barcode,
      category_id: formData.category_id || null,
      is_flexible_price: formData.is_flexible_price,
      image: formData.image
    };

    if (editingId) {
      await supabase.from('products').update(payload).eq('id', editingId);
    } else {
      await supabase.from('products').insert([payload]);
    }

    setIsModalOpen(false);
    setIsSubmitting(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus produk ini secara permanen?')) return;
    await supabase.from('products').delete().eq('id', id);
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
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Produk</h1>
            <p className="text-slate-500 text-sm font-medium">Semua produk akan otomatis tersinkron ke Aplikasi Kasir.</p>
          </div>
          <button onClick={() => openModal()} className="ml-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
            <Plus className="w-5 h-5" /> Produk Baru
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-200 w-72">
              <Search className="w-5 h-5 text-slate-400 mr-2" />
              <input type="text" placeholder="Cari nama atau barcode..." className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400 font-medium" />
            </div>
            <p className="text-sm font-bold text-slate-500">Total: {products.length} Produk</p>
          </div>

          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider">Produk</th>
                <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider">Kategori</th>
                <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider">Harga Jual</th>
                <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider">HPP (Modal)</th>
                <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider">Stok</th>
                <th className="py-4 px-8 font-bold text-slate-600 text-sm uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-lg font-bold text-slate-600">Gudang Kosong</p>
                    <p className="text-sm">Klik tombol &quot;Produk Baru&quot; untuk mulai menambahkan barang.</p>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-8 flex items-center gap-4">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200"><ImageIcon className="w-5 h-5"/></div>
                      )}
                      <div>
                        <p className="font-bold text-slate-800 flex items-center gap-2">
                          {p.name}
                          {p.is_flexible_price && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Fleksibel</span>}
                        </p>
                        <p className="text-xs font-medium text-slate-400">{p.barcode || 'Tanpa Barcode'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-8 text-sm font-medium text-slate-600">
                      {p.categories?.name ? (
                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg">{p.categories.name}</span>
                      ) : '-'}
                    </td>
                    <td className="py-4 px-8 font-bold text-emerald-600">
                      {p.is_flexible_price ? 'Fleksibel' : `Rp ${Number(p.price).toLocaleString('id-ID')}`}
                    </td>
                    <td className="py-4 px-8 text-sm font-medium text-slate-500">Rp {Number(p.capital_price).toLocaleString('id-ID')}</td>
                    <td className="py-4 px-8">
                      <span className={`font-bold px-3 py-1 rounded-lg ${p.stock <= 5 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-4 px-8 flex justify-end gap-2">
                      <button onClick={() => openModal(p)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"><Edit className="w-5 h-5"/></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5"/></button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl my-8">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-3xl sticky top-0 z-10">
              <h2 className="text-xl font-black text-slate-800">{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              
              {/* Image Upload Area */}
              <div className="flex flex-col items-center justify-center mb-6">
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide w-full text-left">Foto Produk</label>
                <label className="w-full h-40 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-colors overflow-hidden relative group">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {formData.image ? (
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-slate-300 mb-2 group-hover:text-indigo-400 transition-colors" />
                      <span className="text-sm font-bold text-slate-400 group-hover:text-indigo-500">Pilih Foto (Opsional)</span>
                    </>
                  )}
                </label>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Nama Produk *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="Misal: Nasi Goreng Spesial" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Kategori</label>
                  <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all">
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Harga Jual *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                    <input type="number" required={!formData.is_flexible_price} disabled={formData.is_flexible_price} value={formData.is_flexible_price ? '' : formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={`w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all ${formData.is_flexible_price ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'focus:bg-white'}`} placeholder="15000" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">HPP (Harga Modal)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                    <input type="number" value={formData.capital_price} onChange={e => setFormData({...formData, capital_price: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="10000" />
                  </div>
                </div>

                <div className="col-span-2 bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:bg-indigo-50 transition-colors" onClick={() => setFormData({...formData, is_flexible_price: !formData.is_flexible_price})}>
                  <div className="mt-0.5">
                    <input type="checkbox" checked={formData.is_flexible_price} onChange={() => {}} className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <p className="font-bold text-indigo-900 text-sm">Harga Fleksibel (Input Manual di Kasir)</p>
                    <p className="text-xs text-indigo-600 mt-0.5">Cocok untuk Jasa Salon / Bengkel / Kiloan / Produk Timbang.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Stok Awal</label>
                  <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="0" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Barcode (Opsional)</label>
                  <input type="text" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="Misal. 899xxxx" />
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
