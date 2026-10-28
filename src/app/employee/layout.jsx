import AppShellNav from "@/components/AppShellNav";

const NAV = [
  { href: "/employee", label: "Delivery", icon: "truck" },
  { href: "/employee/opname", label: "Stock Opname", icon: "clipboard" },
  { href: "/employee/pos", label: "Kasir Cepat", icon: "cart" },
  { href: "/employee/keuangan", label: "Kas & Tutup Kas", icon: "wallet" },
  { href: "/", label: "Beranda", icon: "store" }
];

export default function EmployeeLayout({ children }) {
  return (
    <div className="min-h-screen">
      <AppShellNav title="Workspace Karyawan" subtitle="Gerai Alasbuluh" items={NAV} />
      {children}
    </div>
  );
}
