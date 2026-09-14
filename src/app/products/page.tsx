'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Plus, Package, Edit, Trash2, Loader2, ArrowLeft, Search, X, Image as ImageIcon, LayoutGrid, Beaker } from 'lucide-react';
import Link from 'next/link';

type TabType = 'products' | 'categories' | 'materials';

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Forms State
  const [productForm, setProductForm] = useState({ name: '', price: '', capital_price: '', stock: '', barcode: '', category_id: '', is_flexible_price: false, image: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '' });
  const [materialForm, setMaterialForm] = useState({ name: '', unit: '', stock: '', min_stock: '', cost_per_unit: '' });

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
      .eq('merchant_id', session.user.id)
      .order('created_at', { ascending: false });

    // Ambil Bahan Baku
    const { data: matData } = await supabase
      .from('raw_materials')
      .select('*')
      .eq('merchant_id', session.user.id)
      .order('created_at', { ascending: false });

    if (prodData) setProducts(prodData);
    if (catData) setCategories(catData);
    if (matData) setMaterials(matData);

    setLoading(false);
    setIsModalOpen(false);
    setIsSubmitting(false);
  };

  const openModal = (type: TabType, item?: any) => {
    setEditingId(item ? item.id : null);
    
    if (type === 'products') {
      if (item) {
        setProductForm({
          name: item.name, price: item.price || '', capital_price: item.capital_price || '', stock: item.stock || '',
          barcode: item.barcode || '', category_id: item.category_id || '', is_flexible_price: item.is_flexible_price, image: item.image || ''
        });
      } else {
        setProductForm({ name: '', price: '', capital_price: '', stock: '', barcode: '', category_id: '', is_flexible_price: false, image: '' });
      }
    } else if (type === 'categories') {
      if (item) setCategoryForm({ name: item.name, icon: item.icon || '' });
      else setCategoryForm({ name: '', icon: '' });
    } else if (type === 'materials') {
      if (item) setMaterialForm({ name: item.name, unit: item.unit, stock: item.stock || '', min_stock: item.min_stock || '', cost_per_unit: item.cost_per_unit || '' });
      else setMaterialForm({ name: '', unit: '', stock: '', min_stock: '', cost_per_unit: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      if (activeTab === 'products') {
        const payload = {
          merchant_id: session.user.id,
          name: productForm.name,
          category_id: productForm.category_id || null,
          price: productForm.is_flexible_price ? 0 : Number(productForm.price),
          capital_price: Number(productForm.capital_price) || 0,
          stock: Number(productForm.stock) || 0,
          barcode: productForm.barcode || null,
          is_flexible_price: productForm.is_flexible_price,
          image: productForm.image || null
        };
        if (editingId) await supabase.from('products').update(payload).eq('id', editingId);
        else await supabase.from('products').insert([payload]);
      } 
      else if (activeTab === 'categories') {
        const payload = { merchant_id: session.user.id, name: categoryForm.name };
        if (editingId) await supabase.from('categories').update(payload).eq('id', editingId);
        else await supabase.from('categories').insert([payload]);
      } 
      else if (activeTab === 'materials') {
        const payload = {
          merchant_id: session.user.id,
          name: materialForm.name,
          unit: materialForm.unit,
          stock: Number(materialForm.stock) || 0,
          min_stock: Number(materialForm.min_stock) || 0,
          cost_per_unit: Number(materialForm.cost_per_unit) || 0,
        };
        if (editingId) await supabase.from('raw_materials').update(payload).eq('id', editingId);
        else await supabase.from('raw_materials').insert([payload]);
      }
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data.');
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, table: string) => {
    if (!confirm('Hapus data ini secara permanen?')) return;
    await supabase.from(table).delete().eq('id', id);
    fetchData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      <div className="p-8 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-6 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
          <Link href="/" className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Master Data</h1>
            <p className="text-slate-500 text-sm font-medium">Semua data akan otomatis tersinkron ke Aplikasi Kasir Anda.</p>
          </div>
          <button onClick={() => openModal(activeTab)} className="ml-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
            <Plus className="w-5 h-5" /> 
            {activeTab === 'products' ? 'Produk Baru' : activeTab === 'categories' ? 'Kategori Baru' : 'Bahan Baku Baru'}
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-6">
          <button onClick={() => setActiveTab('products')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'products' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
            <Package className="w-5 h-5" /> Daftar Produk
          </button>
          <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'categories' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
            <LayoutGrid className="w-5 h-5" /> Kategori
          </button>
          <button onClick={() => setActiveTab('materials')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'materials' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
            <Beaker className="w-5 h-5" /> Bahan Baku (Stok)
          </button>
        </div>

        {/* LIST AREA */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
          
          {/* TAB PRODUCTS */}
          {activeTab === 'products' && (
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Produk</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Harga Jual</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Stok</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">Belum ada produk.</td></tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                            {p.image ? <img src={p.image} className="w-full h-full rounded-xl object-cover" /> : <ImageIcon className="w-5 h-5 text-slate-300" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{p.name}</p>
                            <p className="text-xs text-slate-400">{p.barcode || 'Tanpa Barcode'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{p.categories?.name || '-'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-600">{p.is_flexible_price ? 'Fleksibel' : `Rp ${Number(p.price).toLocaleString('id-ID')}`}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{p.stock}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => openModal('products', p)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(p.id, 'products')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB CATEGORIES */}
          {activeTab === 'categories' && (
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Nama Kategori</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.length === 0 ? (
                  <tr><td colSpan={2} className="p-8 text-center text-slate-400">Belum ada kategori.</td></tr>
                ) : (
                  categories.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => openModal('categories', c)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(c.id, 'categories')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB MATERIALS */}
          {activeTab === 'materials' && (
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Nama Bahan Baku</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Sisa Stok</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Batas Minimum</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">HPP / Satuan</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">Belum ada bahan baku.</td></tr>
                ) : (
                  materials.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{m.name} <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded ml-2">{m.unit}</span></td>
                      <td className="px-6 py-4 text-sm font-bold text-indigo-600">{m.stock}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-600">{m.min_stock}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-600">Rp {Number(m.cost_per_unit).toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => openModal('materials', m)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(m.id, 'raw_materials')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODALS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl my-8">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-3xl">
              <h2 className="text-xl font-black text-slate-800">
                {editingId ? 'Edit Data' : 'Tambah Data Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              
              {activeTab === 'products' && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Nama Produk *</label>
                    <input type="text" required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Kategori</label>
                    <select value={productForm.category_id} onChange={e => setProductForm({...productForm, category_id: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <option value="">-- Pilih Kategori --</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Harga Jual *</label>
                    <input type="number" required={!productForm.is_flexible_price} value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} disabled={productForm.is_flexible_price} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">HPP (Modal)</label>
                    <input type="number" value={productForm.capital_price} onChange={e => setProductForm({...productForm, capital_price: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div className="col-span-2 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3">
                    <input type="checkbox" checked={productForm.is_flexible_price} onChange={(e) => setProductForm({...productForm, is_flexible_price: e.target.checked})} className="w-5 h-5 rounded text-indigo-600" />
                    <span className="font-bold text-indigo-900 text-sm">Harga Fleksibel (Input Manual di Kasir)</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Stok Awal</label>
                    <input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Barcode</label>
                    <input type="text" value={productForm.barcode} onChange={e => setProductForm({...productForm, barcode: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                </div>
              )}

              {activeTab === 'categories' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Nama Kategori *</label>
                  <input type="text" required value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Contoh: Minuman Dingin" />
                </div>
              )}

              {activeTab === 'materials' && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Nama Bahan Baku *</label>
                    <input type="text" required value={materialForm.name} onChange={e => setMaterialForm({...materialForm, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Misal: Biji Kopi Arabica" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Satuan *</label>
                    <input type="text" required value={materialForm.unit} onChange={e => setMaterialForm({...materialForm, unit: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="gram / botol / pcs" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Harga Modal / Satuan</label>
                    <input type="number" value={materialForm.cost_per_unit} onChange={e => setMaterialForm({...materialForm, cost_per_unit: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Stok Saat Ini</label>
                    <input type="number" value={materialForm.stock} onChange={e => setMaterialForm({...materialForm, stock: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Batas Minimum (Alert)</label>
                    <input type="number" value={materialForm.min_stock} onChange={e => setMaterialForm({...materialForm, min_stock: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="0" />
                  </div>
                </div>
              )}

              <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 flex items-center gap-2">
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
