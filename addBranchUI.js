const fs = require('fs');
const path = 'src/app/settings/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Insert the save and delete functions
const functions = `
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
`;

code = code.replace(
  "const handleDeleteEmployee = async (id: string) => {",
  functions + "\n  const handleDeleteEmployee = async (id: string) => {"
);

// Insert the Tab UI
const tabUI = `
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
`;

code = code.replace(
  /\{activeTab === 'struk' && \(/,
  tabUI + "\n              {activeTab === 'struk' && ("
);

// Insert Branch Modal
const modalUI = `
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
`;

code = code.replace(
  /\{isEmpModalOpen && \(/,
  modalUI + "\n        {isEmpModalOpen && ("
);

// Also need to import Edit
code = code.replace(
  "Trash2, Eye, Shield, Smartphone, Loader2",
  "Trash2, Eye, Shield, Smartphone, Loader2, Edit"
);

fs.writeFileSync(path, code);
