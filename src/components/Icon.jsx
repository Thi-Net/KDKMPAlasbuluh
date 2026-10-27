/** Set ikon SVG inline (garis besar, konsisten — bukan emoji). */
export function Icon({ name, className = "h-5 w-5", ...props }) {
  const paths = {
    cart: <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 4.6A1 1 0 0 0 5.6 19H19M16 19a1 1 0 1 0 2 0 1 1 0 0 0-2 0Zm-8 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0Z" />,
    box: <><path d="M21 8l-9-5-9 5v8l9 5 9-5V8Z" /><path d="M3 8l9 5 9-5M12 13v8" /></>,
    users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 15.5c1.7.8 2.7 2.3 3 4.5" /></>,
    leaf: <path d="M4 20c0-9 5-15 16-16-1 11-7 16-13 16H4Zm0 0c2-5 5-8 9-10" />,
    receipt: <><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z" /><path d="M9 7h6M9 11h6M9 15h4" /></>,
    store: <><path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6" /></>,
    truck: <><path d="M1 5h13v11H1zM14 9h4l3 3v4h-7" /><circle cx="6" cy="18.5" r="1.8" /><circle cx="17.5" cy="18.5" r="1.8" /></>,
    cash: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M5 9h.01M19 15h.01" /></>,
    chart: <path d="M3 3v18h18M7 15l4-5 3 3 5-7" />,
    warning: <><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4m0 3h.01" /></>,
    fire: <path d="M12 22c4 0 7-2.7 7-7 0-3-2-5.5-3.5-7C15 6.5 15 4 13 2c0 3-1.5 4.5-3 6C8.5 9.5 5 12 5 15c0 4.3 3 7 7 7Z" />,
    phone: <path d="M4 3h4l2 5-2.5 1.5a12 12 0 0 0 7 7L16 14l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 2 5a2 2 0 0 1 2-2Z" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    pin: <><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>,
    clipboard: <><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V2h6v2M9 10h6M9 14h6" /></>,
    wallet: <><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10h20M16 15h2" /></>,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
    arrowRight: <path d="M5 12h14m-6-6 6 6-6 6" />,
    check: <path d="m4 12 5 5L20 6" />,
    qr: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14h1v1h-1zM14 20h1v1h-1zM18 18h3v3h-3z" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      {paths[name] || paths.box}
    </svg>
  );
}

/** Lambang koperasi: bendera merah-putih dengan emas */
export function KoperasiLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="23" fill="#FFFFFF" stroke="#F9A825" strokeWidth="2" />
      <path d="M10 18h28v9a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2v-9Z" fill="#C62828" />
      <path d="M10 27h28v3a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2v-3Z" fill="#FFFFFF" />
      <text x="24" y="16" textAnchor="middle" fontFamily="Rubik, sans-serif" fontWeight="700" fontSize="8" fill="#8E1B1B">KOPERASI</text>
      <path d="M18 36h12" stroke="#F9A825" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
