# IPT Web

> Run your `.ipt` random generator files in the browser. No install, no backend, no tracking.

[📖 Spec](./SPEC.md) · [🐛 Issues](https://github.com/skarginson/ipt-web/issues)

![Screenshot](./docs/screenshot.png)

---

## What is this?

**IPT Web** is a browser-based runner for `.ipt` files — text-based random generator files used by tabletop RPG game masters to produce NPCs, names, treasures, encounters, and other random content.

The original format was designed for **[Inspiration Pad Pro](https://www.nbos.com/products/inspiration-pad-pro)** by NBOS Software, a Windows-only desktop app. Many excellent community-made `.ipt` files exist but are inaccessible to anyone on macOS, Linux, or mobile. This project fixes that by reimplementing just enough of the format to run those files from any browser.

## What is a `.ipt` file?

Plain text. Tables of possible outputs, plus templates that combine them.

```ipt
Table: Greeting
Hello, [@Name]! You are feeling [@Mood] today.

Table: Name
Aria
Boris
Céline

Table: Mood
cheerful
contemplative
mischievous
```

Running `Greeting` picks one random `Name` and one random `Mood` and produces, for example:

> Hello, Boris! You are feeling mischievous today.

See [`SPEC.md`](./SPEC.md) §5 for the complete list of supported syntax.

## Features

- 📂 **Drag-and-drop** one or more `.ipt` files — they stay in your browser, nothing is uploaded.
- 🎲 **Run any generator** with a click.
- 🔗 **Cross-file references** — load several files and tables can reference each other freely.
- 🇫🇷 **Windows-1252 encoding support** for legacy files (most French-language generators use this).
- 📱 **Works on mobile** — responsive layout.
- 🌗 **Dark mode**.
- 📋 **Copy results** to clipboard in one click.
- 🕰 **History** of past generations in the current session.

## Try it without uploading anything

The live demo ships with example `.ipt` files pre-loaded. Just open it, pick a generator in the left panel, and click **Generate**.

## Local development

```bash
git clone https://github.com/skarginson/ipt-web.git
cd ipt-web
npm install
npm run dev
```

Requires **Node.js 20** or newer.

### Build for production

```bash
npm run build
npm run preview
```

The built site is a fully static bundle in `dist/` — deployable to any static host (GitHub Pages, Vercel, Netlify, Cloudflare Pages, or your own server).

## Project structure

```
src/
├── core/         # Framework-agnostic parser & evaluator (no React, no DOM)
├── components/   # React UI
├── lib/          # Browser-specific helpers (file reading)
└── App.tsx
```

The `core/` module has no React or DOM dependency and can be reused in Node.js, a CLI, or another UI framework.

## Contributing

Contributions are welcome! Some ideas for future work:

- Dice expressions: `{1d6}`, `{2d10+3}`
- Variable assignment and reuse: `{var=...}` and `{var}`
- Weighted entries (e.g. `3, Orc` = three times more likely)
- Additional filters beyond `implode` (`PlusMinus`, `Each`, `EachChar`)
- In-browser `.ipt` editor with syntax highlighting
- LocalStorage persistence of loaded files
- Share-by-URL (generator state encoded in URL hash)
- Seeded RNG for reproducible output

See [`SPEC.md`](./SPEC.md) for current scope. Please open an issue before submitting a large PR so we can align on approach.

### Development conventions

- `src/core/` **must not** import from React, the DOM, or any browser API.
- Add Vitest tests when touching the parser — parsers break in subtle ways.
- Prefer graceful degradation over throwing: a malformed `.ipt` should produce *some* output plus a console warning, never a crash.

## FAQ

**Is this affiliated with NBOS Software?**
No. `.ipt` is a file format originally created for NBOS's *Inspiration Pad Pro*. This project is an independent, clean-room reimplementation of the format, built for interoperability. No NBOS code is used. The "Inspiration Pad Pro" trademark is not used in this project's name or branding.

**Will my `.ipt` files work?**
If they use only table declarations, simple references (`[@Table]`), multi-picks with the `implode` filter (`[!N Table >> implode]`), HTML entity references (`[&#x2640]`), and the `\n` escape — yes. Dice, variables, weights, and other filters are **not yet supported** (see contributing ideas above).

**Are my files uploaded anywhere?**
No. Everything runs in your browser. There is no backend, no analytics, no telemetry. Check the [source code](./src) and the [network tab](https://developer.chrome.com/docs/devtools/network) if you want to verify.

**Where can I find `.ipt` files?**
The [RPG Inspiration community](http://www.rpginspiration.com/) hosts many. You can also write your own — the format is tiny and human-readable.

## License

[MIT](./LICENSE) — do whatever you want with it, just keep the copyright notice.
