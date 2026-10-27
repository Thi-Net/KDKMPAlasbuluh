import "./globals.css";

export const metadata = {
  title: "Koperasi Desa Merah Putih Alasbuluh",
  description: "Platform Digital Koperasi Desa Merah Putih — Gerai Alasbuluh, Wongsorejo, Banyuwangi",
  manifest: "/manifest.json"
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#C62828" };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
