import { CartProvider } from "@/components/CartContext";
import Header from "./header";

export default function ShopLayout({ children }) {
  return (
    <CartProvider>
      <Header />
      {children}
    </CartProvider>
  );
}
