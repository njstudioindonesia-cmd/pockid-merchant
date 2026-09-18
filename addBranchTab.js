const fs = require('fs');
const path = 'src/app/settings/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Insert tab
code = code.replace(
  "{ id: 'karyawan', label: 'Karyawan', icon: Users, desc: 'Hak akses kasir' },",
  "{ id: 'cabang', label: 'Manajemen Cabang', icon: Store, desc: 'Multi-outlet', enterpriseOnly: true },\n      { id: 'karyawan', label: 'Karyawan', icon: Users, desc: 'Hak akses kasir' },"
);

// Filter tabs by enterprise
code = code.replace(
  /const tabs = \[\n[\s\S]*?\];/,
  "const tabs = [\n      { id: 'profil', label: 'Profil Toko', icon: Store, desc: 'Nama & Alamat Cabang' },\n      { id: 'struk', label: 'Struk & Kasir', icon: Receipt, desc: 'Pajak & Catatan Struk' },\n      { id: 'cabang', label: 'Manajemen Cabang', icon: Store, desc: 'Multi-outlet', enterpriseOnly: true },\n      { id: 'karyawan', label: 'Karyawan', icon: Users, desc: 'Hak akses kasir' },\n      { id: 'pembayaran', label: 'Pembayaran', icon: CreditCard, desc: 'Tunai, QRIS, Transfer' },\n      { id: 'online', label: 'Toko Online', icon: ShoppingBag, desc: 'Katalog Digital' },\n      { id: 'keamanan', label: 'Keamanan & Backup', icon: Lock, desc: 'Keamanan Data Cloud' },\n      { id: 'lisensi', label: 'Lisensi PRO', icon: Crown, desc: 'Berlangganan Sistem' },\n    ].filter(t => !t.enterpriseOnly || hpSettings?.proType === 'enterprise');"
);

fs.writeFileSync(path, code);
