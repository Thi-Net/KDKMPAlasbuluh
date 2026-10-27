export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="bg-koperasi-red text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="text-sm font-bold">📊 Dashboard Admin — Koperasi Merah Putih Alasbuluh</div>
          <nav className="flex flex-wrap gap-1 text-xs sm:text-sm">
            <a className="rounded bg-white/10 px-3 py-1 hover:bg-white/20" href="/admin">Dashboard</a>
            <a className="rounded bg-white/10 px-3 py-1 hover:bg-white/20" href="/admin/products">Produk & Stok</a>
            <a className="rounded bg-white/10 px-3 py-1 hover:bg-white/20" href="/admin/opname">Approval Opname</a>
            <a className="rounded bg-white/10 px-3 py-1 hover:bg-white/20" href="/admin/users">Akun</a>
            <a className="rounded bg-white/10 px-3 py-1 hover:bg-white/20" href="/admin/audit">Audit Log</a>
            <a className="rounded bg-white/10 px-3 py-1 hover:bg-white/20" href="/">Beranda</a>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
