# Motion — Landing Page Koperasi Alasbuluh

Referensi: `MOTION-SPEC.md` (turunan PRD Jitter, GATE-1 disetujui 27 Okt 2026).

## Cara menambah animasi baru
1. Cek dulu apakah pola sudah ada (FadeSlide / DeviceReveal / MeshGradient / GlassPill di `src/components/motion.jsx`).
2. Durasi/easing/jeda WAJIB lewat token di `globals.css` (`--motion-*`, `--ease-*`) — dilarang hardcode di komponen.
3. State sembunyi awal hanya di bawah `.js-motion` (dipasang via `MotionRoot`) supaya konten terbaca tanpa JS.
4. Animasi hanya `transform` + `opacity` (+ `filter` terbatas); hormati `prefers-reduced-motion`.
5. Reveal on scroll: pakai `useRevealOnScroll()` + atribut `data-motion="fade-slide"` (sekali jalan, IO-based).

## Token (globals.css)
Durasi: nav 280ms, text 400/1000ms, device 1080ms, ambient 16s. Delay/stagger sesuai linimasa hero MOTION-SPEC. Easing: `--ease-soft`, `--ease-out-text`, `--ease-in-exit`, `--ease-ambient`.

## Do & Don't
- DO: sekali jalan; ambient berhenti saat tab hidden; hover hanya `(hover:hover)`.
- DON'T: animasi width/height/top/left; scroll-jacking; blur besar dianimasikan; library animasi tambahan (nol dependency baru).
