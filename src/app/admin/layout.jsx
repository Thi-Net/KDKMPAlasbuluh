import AppShellNav from "@/components/AppShellNav";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "chart" },
  { href: "/admin/products", label: "Produk & Stok", icon: "box" },
  { href: "/admin/opname", label: "Approval Opname", icon: "clipboard" },
  { href: "/admin/users", label: "Akun", icon: "users" },
  { href: "/admin/laporan", label: "Laporan", icon: "receipt" },
  { href: "/admin/audit", label: "Audit Log", icon: "lock" },
  { href: "/", label: "Beranda", icon: "store" }
];

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen">
      <AppShellNav title="Dashboard Admin" subtitle="Koperasi Merah Putih Alasbuluh" items={NAV} />
      {children}
    </div>
  );
}
