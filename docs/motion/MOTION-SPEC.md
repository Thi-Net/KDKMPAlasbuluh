# MOTION-SPEC — Landing Page Koperasi Alasbuluh (v1.0, 27 Okt 2026)

Sumber: PRD "Update Motion Design Landing Page (Referensi Jitter)" §6, diverifikasi terhadap analisis frame Scene.gif (nilai *terukur* ±40 ms) + keputusan GATE-1 pemilik (27 Okt 2026).

**Keputusan GATE-1 (pemilik):**
1. Palet gradient hero: versi koperasi — merah-pink-emas (bukan cyan Jitter). Dingin→hangat: tetap pola "warna hangat naik dari bawah" referensi, tapi seluruh hue di-shift ke brand.
2. Mockup: placeholder bergaya sama (belum ada tangkapan layar).
3. Copy hero: pakai copy yang sudah ada.
4. Referensi: cukup spesifikasi tertulis PRD §6; verifikasi internal T1 = menyandingkan linimasa §6.2 dgn token §7 — tidak ada koreksi (konsisten).

## Linimasa hero (sekali jalan saat load, tanpa fade out — FR-02)
| t (ms) | Elemen | Gerak |
|---|---|---|
| 0 | Logo, tombol Masuk, gradient | Tampil sejak awal (statis) |
| 640–960 | Tautan navbar | Fade-in bergantian kiri→kanan, stagger 80 ms, dur 280 ms |
| 1240–2320 | Mockup ponsel + layar lebar | Opacity 0→1 + translateX(-14→0) + saturate(0.6→1), dur 1080 ms |
| 1480–2760 | Headline per baris | Fade + geser kiri 16 px, dur 400/400/1000 ms, stagger 160 ms |
| 2240–3200 | Paragraf + CTA | Fade in nyaris serentak, stagger 60 ms, dur 900 ms |
| ambient | Gradient mesh | Transform pelan, siklus 16 s, ease-ambient |

Section lain (turunan, disetujui GATE-2 implisit via peta §8): fade+geser kiri 16 px saat masuk viewport (trigger 85%), stagger kartu 70 ms, sekali jalan.

## Token
Lihat `src/app/globals.css` blok `:root` (satu sumber kebenaran; JS membaca via CSS custom properties). Nilai identik PRD §7.

## Palet gradient hero (versi koperasi, GATE-1)
`#8E1B1B` (merah tua) → `#C62828` (merah) → `#E0574F` (koral) → `#F9A825` (emas) → `#FBC02D` (kuning emas). Hangat naik dari bawah-kanan, merah tua dominan kiri-atas.

## Reduced motion (FR-07)
Semua durasi → 1 ms, delay/stagger/shift → 0, ambient statis (override di :root, media query di globals.css).

## Primitif (T6)
- `FadeSlide` — fade + geser horizontal, delay/dur via token, sekali jalan (IO).
- `SplitLines` — pecah teks per baris, `aria-label` menjaga teks asli.
- `DeviceReveal` — opacity+translateX+filter saturate sekali jalan.
- `MeshGradient` — 3 lapisan radial-gradient, transform ambient; berhenti saat tak terlihat/tab tidak aktif; fallback statis tanpa JS.
- `GlassPill` — rgba(255,255,255,.25) di atas gradient; backdrop-filter hanya `(hover:hover) and (min-width:768px)`.
