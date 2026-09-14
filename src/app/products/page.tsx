'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Plus, Package, Edit, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('merchant_id', session.user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const handleAddDemoProduct = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    setLoading(true);
    await supabase.from('products').insert({
      merchant_id: session.user.id,
      name: 'Produk Cloud ' + Math.floor(Math.random() * 100),
      price: 15000 + (Math.floor(Math.random() * 10) * 1000),
      stock: 50
    });
    await fetchProducts();
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Produk</h1>
          <p className="text-slate-500 text-sm">Produk yang dibuat di sini akan otomatis sinkron ke HP Kasir.</p>
        </div>
        <button onClick={handleAddDemoProduct} className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Tambah Produk
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-4 px-6 font-bold text-slate-600 text-sm">Nama Produk</th>
              <th className="py-4 px-6 font-bold text-slate-600 text-sm">Harga Jual</th>
              <th className="py-4 px-6 font-bold text-slate-600 text-sm">Stok</th>
              <th className="py-4 px-6 font-bold text-slate-600 text-sm text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-slate-500">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  Belum ada produk. Klik Tambah Produk.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-6 font-medium text-slate-800">{p.name}</td>
                  <td className="py-4 px-6 text-slate-600">Rp {p.price.toLocaleString('id-ID')}</td>
                  <td className="py-4 px-6 text-slate-600">{p.stock}</td>
                  <td className="py-4 px-6 flex justify-end gap-2">
                    <button className="p-2 text-indigo-500 hover:bg-indigo-50 rounded"><Edit className="w-4 h-4"/></button>
                    <button className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
