export default function EmployeeLayout({ children }) {
  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="bg-koperasi-darkred text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="text-sm font-bold">👷 Workspace Karyawan — Gerai Alasbuluh</div>
          <nav className="flex flex-wrap gap-1 text-xs sm:text-sm">
            <a className="rounded bg-white/10 px-3 py-1 hover:bg-white/20" href="/employee">Delivery</a>
            <a className="rounded bg-white/10 px-3 py-1 hover:bg-white/20" href="/employee/opname">Stock Opname</a>
            <a className="rounded bg-white/10 px-3 py-1 hover:bg-white/20" href="/employee/pos">Kasir Cepat</a>
            <a className="rounded bg-white/10 px-3 py-1 hover:bg-white/20" href="/employee/keuangan">Kas & Tutup Kas</a>
            <a className="rounded bg-white/10 px-3 py-1 hover:bg-white/20" href="/">Beranda</a>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
