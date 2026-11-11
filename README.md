# ⛩️ kamioshi.si // 絵馬掛け

A digital Japanese votive plaque (*ema* 絵馬) shrine wall where visitors carve, dedicate, and hang wooden plaques for who or what they cherish most—their *kami-oshi* (神推し).

Built with React 18, TypeScript, Tailwind CSS, Vite, and procedural Web Audio.

---

## ✨ Features

- **Blender 3D Baked Timber Realism**: Pre-rendered 2.5D wooden finishes (*Hinoki Cypress*, *Pale Sandalwood*, *Aged Cedar*, *Vermilion Lacquer*, *Charred Sugi*, *Kinpaku Gold*) with authentic hand-planed chamfer bevels (*mentori* 面取り) and raytraced contact shadows.
- **Dual Visual Modes**:
  - 🌙 **Midnight (幽玄)**: Reverent Shinto courtyard at dusk with glowing lanterns, dark timber racks, and deep shadows.
  - 🌸 **Sakura (朝桜)**: Warm spring morning daylight with soft washi paper, natural cypress beam, and floating cherry blossoms.
- **Traditional Sound Synthesis**: Zero external audio files. All acoustics—including the Hirajōshi-tuned Koto harp melody, Suzu shrine bells, and wooden clacks—are synthesized natively in real-time via the Web Audio API.
- **Grounded Omikuji (御神籤)**: Grounded daily reflections and mindfulness paired with digital shrine stamps (*goshuin* 御朱印), completely free of false predictive claims.
- **Downloadable Keepsakes**: 1200×1350 high-resolution keepsake cards rendered directly to HTML5 Canvas for sharing or printing.
- **Anti-Bot & Content Safety**:
  - Deterministic client-side spam, flood, and insult heuristics.
  - On-device Chromium `LanguageModel` Prompt API (Gemini Nano) evaluation when supported.
  - SHA-256 Proof-of-Work to deter automated bulk spam without intrusive captchas.
  - Zero external tracking, zero ads, zero user accounts required.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation & Local Run

```bash
git clone https://github.com/namerboy/kamioshi-si.git
cd kamioshi-si
npm install
npm run dev
```

Visit `http://localhost:5173/`.

### Build for Production

```bash
npm run build
```

Production static assets will output to `dist/`, ready for deployment to Cloudflare Pages, Vercel, or Netlify.

---

## 📜 License

MIT License. Dedicated to creators, artists, and communities everywhere.
