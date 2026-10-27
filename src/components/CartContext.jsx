"use client";
import { createContext, useContext, useEffect, useState } from "react";

const CartCtx = createContext(null);
export const useCart = () => useContext(CartCtx);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem("kmp_cart") || "[]")); } catch (e) { setItems([]); }
  }, []);

  const persist = (next) => {
    setItems(next);
    try { localStorage.setItem("kmp_cart", JSON.stringify(next)); } catch (e) {}
  };

  const add = (product, qty = 1) => {
    const exist = items.find((i) => i.product_id === product.id);
    const current = exist ? exist.qty : 0;
    const newQty = Math.min(current + qty, product.current_stock);
    if (current >= product.current_stock) return false;
    if (exist) persist(items.map((i) => (i.product_id === product.id ? { ...i, qty: newQty } : i)));
    else persist([...items, { product_id: product.id, name: product.name, price: Number(product.selling_price), qty: newQty, stock: product.current_stock }]);
    return true;
  };

  const setQty = (productId, qty) => {
    if (qty <= 0) return persist(items.filter((i) => i.product_id !== productId));
    persist(items.map((i) => (i.product_id === productId ? { ...i, qty: Math.min(qty, i.stock) } : i)));
  };

  const clear = () => { setItems([]); try { localStorage.removeItem("kmp_cart"); } catch (e) {} };

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return <CartCtx.Provider value={{ items, add, setQty, clear, total, count }}>{children}</CartCtx.Provider>;
}
