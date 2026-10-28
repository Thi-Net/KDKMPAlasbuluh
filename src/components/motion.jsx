"use client";
/**
 * Primitif motion landing page (docs/motion/MOTION-SPEC.md).
 * Semua durasi/easing dibaca dari CSS custom properties (globals.css) — tanpa hardcode.
 * Konten terbaca tanpa JS: class .js-motion dipasang di sini (client), gaya sembunyi
 * di globals.css hanya berlaku di bawah .js-motion.
 */
import { useEffect, useRef } from "react";

// Pasang penanda JS sekali per dokumen (progressive enhancement).
export function MotionRoot() {
  useEffect(() => {
    document.documentElement.classList.add("js-motion");
  }, []);
  return null;
}

function prefersReduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * FadeSlide — reveal sekali jalan saat masuk viewport (IntersectionObserver).
 * data-motion="fade-slide"; delay via style (token dibaca CSS).
 */
export function useRevealOnScroll(deps = []) {
  useEffect(() => {
    if (prefersReduced()) return;
    const els = Array.from(document.querySelectorAll('[data-motion="fade-slide"]:not([data-motion-done])'));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target;
          el.setAttribute("data-motion-done", "1");
          const i = Number(el.dataset.motionIndex || 0);
          const base = Number(el.dataset.motionBase || 0);
          const stagger = Number(el.dataset.motionStagger || 70);
          el.style.transition = `opacity var(--motion-dur-text) var(--ease-out-text) ${base + i * stagger}ms, transform var(--motion-dur-text) var(--ease-out-text) ${base + i * stagger}ms`;
          el.style.opacity = "1";
          el.style.transform = "translateX(0)";
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -15% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, deps); // re-scan saat konten dinamis (CMS/produk) selesai dimuat
}

/** Animasi masuk hero sekali jalan: set style transisi sesuai token lalu buka state. */
export function useHeroEntrance() {
  useEffect(() => {
    if (prefersReduced()) return;
    // Force reflow agar computed style awal (opacity 0) tercatat dulu,
    // baru buka state supaya transisi benar-benar berjalan (aman di tab latar).
    const first = document.querySelector("[data-hero]");
    if (first) void first.offsetWidth;
    const run = (sel, fn) => document.querySelectorAll(sel).forEach(fn);
    // navbar links: fade in bergantian (640ms + stagger 80ms)
    run('[data-hero="nav-link"]', (el, i) => {
      el.style.transition = `opacity var(--motion-dur-nav) var(--ease-soft) ${640 + i * 80}ms`;
      el.style.opacity = "1";
    });
    // headline per baris (1480ms + stagger 160ms; baris terakhir 1000ms)
    run('[data-hero="headline-line"]', (el, i) => {
      const dur = i >= 2 ? "var(--motion-dur-text-slow)" : "var(--motion-dur-text)";
      el.style.transition = `opacity ${dur} var(--ease-out-text) ${1480 + i * 160}ms, transform ${dur} var(--ease-out-text) ${1480 + i * 160}ms`;
      el.style.opacity = "1";
      el.style.transform = "translateX(0)";
    });
    // paragraf + CTA (2240ms + stagger 60ms)
    run('[data-hero="para"]', (el, i) => {
      el.style.transition = `opacity var(--motion-dur-text-slow) var(--ease-soft) ${2240 + i * 60}ms`;
      el.style.opacity = "1";
    });
    // mockup devices (1240ms, samar→pekat)
    run('[data-hero="device"]', (el) => {
      el.style.transition = `opacity var(--motion-dur-device) var(--ease-soft) 1240ms, transform var(--motion-dur-device) var(--ease-soft) 1240ms, filter var(--motion-dur-device) var(--ease-soft) 1240ms`;
      el.style.opacity = "1";
      el.style.transform = "translateX(0)";
      el.style.filter = "saturate(1)";
    });
    // gradient ambient: pause saat tab tersembunyi
    const mesh = document.querySelector('[data-hero="mesh"]');
    const onVis = () => {
      if (!mesh) return;
      mesh.getAnimations({ subtree: true }).forEach((a) => (document.hidden ? a.pause() : a.play()));
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
}

/**
 * SplitLines — pecah teks per baris (dipisah "\n" di source) menjaga teks asli
 * untuk screen reader via aria-label. Tanpa JS: teks tetap utuh.
 */
export function SplitLines({ text, className = "", lineClassName = "" }) {
  const lines = String(text).split("\n");
  return (
    <span className={className} aria-label={lines.join(" ")} role="text">
      {lines.map((l, i) => (
        <span key={i} aria-hidden="true" className={`block ${lineClassName}`}>
          <span
            data-hero="headline-line"
            className="inline-block"
            style={{ opacity: undefined }}
          >
            {l}
          </span>
        </span>
      ))}
    </span>
  );
}

/** MeshGradient — 3 lapisan radial-gradient brand (versi koperasi, GATE-1), ambient transform pelan. */
export function MeshGradient() {
  return (
    <div data-hero="mesh" aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="mesh-layer absolute inset-[-20%]"
        style={{
          background: "radial-gradient(60% 55% at 18% 12%, #8E1B1B 0%, transparent 70%)",
          animation: `meshA var(--motion-dur-ambient) var(--ease-ambient) infinite alternate`,
        }}
      />
      <div
        className="mesh-layer absolute inset-[-20%]"
        style={{
          background: "radial-gradient(55% 60% at 82% 20%, #F9A825 0%, transparent 68%)",
          animation: `meshB calc(var(--motion-dur-ambient) * 1.25) var(--ease-ambient) infinite alternate`,
        }}
      />
      <div
        className="mesh-layer absolute inset-[-20%]"
        style={{
          background: "radial-gradient(65% 55% at 65% 95%, #F94E69 0%, transparent 66%)",
          animation: `meshC calc(var(--motion-dur-ambient) * 0.85) var(--ease-ambient) infinite alternate`,
        }}
      />
      <style>{`
        @keyframes meshA { from { transform: translate3d(0,0,0) rotate(0deg); } to { transform: translate3d(2.5%, 1.5%, 0) rotate(1.5deg); } }
        @keyframes meshB { from { transform: translate3d(0,0,0) scale(1); } to { transform: translate3d(-2%, 2%, 0) scale(1.06); } }
        @keyframes meshC { from { transform: translate3d(0,0,0); } to { transform: translate3d(-1.5%, -2.5%, 0); } }
        @media (prefers-reduced-motion: reduce) { .mesh-layer { animation: none !important; } }
      `}</style>
    </div>
  );
}

/** GlassPill — pill semi-transparan di atas gradient (elemen kaca referensi). */
export function GlassPill({ children, className = "", ...rest }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-white/25 px-4 py-1.5 text-xs font-bold text-white ring-1 ring-white/30 ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
