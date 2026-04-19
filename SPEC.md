# IPT Web — Open-Source Web Generator for `.ipt` Files

## 1. Project Overview

**Goal.** Build a small, open-source web application that reads `.ipt` generator files (the format used by [NBOS Software's Inspiration Pad Pro](https://www.nbos.com/products/inspiration-pad-pro)) and runs them in the browser. Tabletop RPG Game Masters use these files to generate random content (names, NPCs, encounters, etc.). The desktop program is old and only runs on Windows; this project makes `.ipt` files usable on any device with a browser.

**Approach.** 100% client-side. No backend, no database, no authentication. Upload files, generate output, done. Hostable for free on GitHub Pages or Vercel.

**Legal positioning.** This is a **clean-room reimplementation** of the `.ipt` file format. No code from NBOS is copied or referenced. File formats are not protected by copyright; reimplementing them for interoperability is well-established practice. The project does not use the "Inspiration Pad Pro" trademark in its name or branding.

**License.** MIT.

---

## 2. Goals & Non-Goals

### Goals (MVP — v1.0)
- Load one or more `.ipt` files via upload, paste, or pre-loaded examples.
- Run any declared generator (table) and display the result.
- Support the syntax subset actually used by real-world French-language JDR generators (see §5).
- Render HTML formatting (`<b>`, `<i>`) produced by generators.
- Keep everything in-memory — session only.
- Clean, mobile-friendly UI.

### Non-Goals (for v1.0)
- No dice expressions (`{1d6}`) — not used by the target corpus.
- No user-defined variables (`{var=...}`) — not used.
- No weighted tables — not used.
- No mathematical expressions.
- No in-browser `.ipt` editor with syntax highlighting (v1 uses a plain `<textarea>`).
- No persistence (`localStorage`) — keep state ephemeral for v1.
- No tests for v1. Add them when the parser stabilizes.
- No authentication, no backend, no sharing, no user accounts.

### Future extensions (explicitly out of v1 scope)
Document these in the README as future ideas, but don't build them:
- Support for dice, variables, weighted tables, more filters (`PlusMinus`, `Each`, `EachChar`).
- CodeMirror-based editor with syntax highlighting for `.ipt`.
- LocalStorage persistence of loaded files.
- Share-by-URL (encode generator state in URL hash).
- Seeded RNG for reproducible output.
- Export history as Markdown or JSON.

---

## 3. Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Build tool | **Vite** (`react-ts` template) | Zero-config, fast HMR, modern defaults. |
| Framework | **React 18 + TypeScript** | Standard, good DX, strict typing helps the parser. |
| Styling | **Tailwind CSS** | No custom CSS needed. |
| State | **`useState` only** | Scope is small enough that a store is overkill. |
| Editor | **`<textarea>`** | CodeMirror is a distraction for v1. |
| Tests | **None for v1** | Add Vitest once the parser is stable. |
| Hosting | **GitHub Pages** or **Vercel** | Free, static. |

**Node version:** 20 LTS or newer.

---

## 4. Project Structure

```
ipt-web/
├── README.md
├── LICENSE                    # MIT
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
│
├── src/
│   ├── main.tsx               # React entry point
│   ├── App.tsx                # Single top-level component (OK for v1)
│   │
│   ├── core/                  # 100% framework-agnostic. No React, no DOM.
│   │   ├── types.ts           # AST types: Table, Entry, Node (TextNode, RefNode, MultiRefNode)
│   │   ├── parser.ts          # parse(source: string): Table[]
│   │   ├── evaluator.ts       # evaluate(tableName, registry): string
│   │   ├── registry.ts        # Registry: Map<string, Table> — merge multiple files
│   │   └── index.ts           # Public API barrel
│   │
│   ├── components/
│   │   ├── FileDropzone.tsx   # Drag-and-drop + file picker
│   │   ├── GeneratorList.tsx  # List of available tables, click to run
│   │   ├── ResultPanel.tsx    # HTML-rendered result + history
│   │   └── SyntaxHelp.tsx     # Collapsible supported-syntax reference
│   │
│   ├── lib/
│   │   └── readFile.ts        # Read File as Windows-1252 (see §9)
│   │
│   └── index.css              # Tailwind directives
│
└── public/
    └── examples/              # Pre-loaded sample .ipt files (see §11)
        ├── figurants.ipt
        └── aleamundi.ipt
```

**Architectural rule.** `src/core/` must never import from React, the DOM, or any browser API. It should be possible to run it in Node.js (useful for eventual CLI or testing).

---

## 5. `.ipt` File Format Specification

This is the most critical section. The parser must handle all of the following — and **nothing more** for v1. Anything not specified here should either be ignored gracefully or produce a clear error message.

### 5.1 File encoding

- **`.ipt` files are encoded in Windows-1252 / Latin-1, NOT UTF-8.**
- The app must read files with `FileReader.readAsText(file, 'windows-1252')`.
- Line endings are typically `\r\n` (CRLF) but may be mixed. Normalize to `\n` after reading.

### 5.2 Table declaration

A table starts with a line matching **either** of these two forms:

```
Table: Name
Table:Name
```

- Case of `Table:` is fixed (capital T, lowercase rest). The parser must match the literal `Table:` prefix.
- The name can contain letters, digits, underscores, and HTML entities (see §5.6). No spaces in names.
- Trailing whitespace on the declaration line is ignored.
- Declaration names are case-sensitive.

### 5.3 Table entries

- Every non-empty line after a `Table:` declaration, up to the next `Table:` declaration or end of file, is an **entry**.
- Blank lines **between entries are ignored** (they don't produce empty entries).
- Blank lines are also used as visual separators between tables — the parser should tolerate any number of them.
- Entries are unweighted: all entries in a table are equiprobable.
- An entry's text may contain references (§5.4, §5.5), HTML tags (§5.7), and escape sequences (§5.8).

### 5.4 Simple reference: `[@TableName]`

Replaced at evaluation time by one random entry picked from `TableName`, evaluated recursively.

```
[@Positif]        → one random entry from the "Positif" table
```

### 5.5 Multi-pick reference: `[!N TableName >> filter]`

Picks `N` distinct entries from `TableName` (without replacement) and joins them using the named filter.

**Syntax variants to accept:**
- `[!2 Cadre >> implode]`    (spaces around `>>`)
- `[!3 Motclef>>implode]`    (no spaces around `>>`)
- `[!N TableName >>implode]` (mixed — parser must tolerate any whitespace around `>>`)

**Supported filters (v1):**
- **`implode`** — joins the N picks with `", "` (comma-space).

**Behaviour if N > table size:** return all entries shuffled (do not crash, do not repeat).

**Unknown filters:** evaluate the picks without a filter (simple space-join) and log a warning to the console. Do not crash.

### 5.6 HTML entity references: `[&#xNNNN]`

Some generators reference tables whose names are Unicode characters expressed as HTML entities. Examples seen in real files:

- `[&#x2640]` — decodes to `♀` (used as a reference to a table named `♀`)
- `[&#x2642]` — decodes to `♂`

**Implementation:**
- When parsing a reference of the form `[&#xNNNN]` or `[&#NNNN]`, decode the entity and treat the result as a simple reference to the table with that name (e.g. `[&#x2640]` ≡ `[@♀]`).
- When parsing a `Table:` declaration, if the declared name is a single-character entity or the actual character, store it under the decoded form so both `Table: ♀` and `Table: &#x2640` reference the same table.

### 5.7 HTML passthrough

Entries may contain HTML tags — most commonly `<b>`, `<i>`, `<br>`. The parser must **preserve these tags verbatim** in the output. The UI renders the result with `dangerouslySetInnerHTML` (safe because the source is a file the user uploaded themselves).

**Tags observed in real files:** `<b>`, `<i>`. Assume any HTML tag should pass through unchanged.

### 5.8 Escape sequences

- **`\n`** (two characters: backslash + lowercase n) — must be replaced by a literal newline `\n` in the output. In the rendered HTML, convert `\n` to `<br>` so the newline is visible.
- **`\r`, `\t`** — not observed in the target corpus. If present, pass through unchanged.
- **`\\`** — not observed. Not required for v1.

### 5.9 Multi-file resolution

- Multiple `.ipt` files can be loaded at once.
- All tables from all loaded files live in a **single flat registry** (`Map<string, Table>`).
- If two files define the same table name, the **last loaded wins** (log a warning).
- References in one file can point to tables defined in any other loaded file.

### 5.10 Things to ignore gracefully

Anything in the file that doesn't match the above spec:
- Unknown `[...]` patterns → render as literal text, log a warning.
- Unknown `{...}` patterns → render as literal text (these would be dice/vars, explicitly out of scope).
- Malformed `Table:` lines → skip, log a warning.

**The parser should never throw on a real `.ipt` file.** It should always produce *some* output.

---

## 6. Core Module API

The `src/core/` module should export a small, clean API:

```ts
// types.ts
export type Entry = Node[];

export type Node =
  | { kind: 'text'; value: string }
  | { kind: 'ref'; tableName: string }
  | { kind: 'multiRef'; count: number; tableName: string; filter: string | null };

export type Table = {
  name: string;
  entries: Entry[];
};

export type ParseWarning = {
  line: number;
  message: string;
};

export type ParseResult = {
  tables: Table[];
  warnings: ParseWarning[];
};

// parser.ts
export function parse(source: string): ParseResult;

// registry.ts
export class Registry {
  add(tables: Table[]): void;
  get(name: string): Table | undefined;
  listNames(): string[];
  clear(): void;
}

// evaluator.ts
export type EvalResult = {
  output: string;          // HTML-safe string with <br> for newlines
  rawOutput: string;       // same, but with \n instead of <br>
  warnings: string[];
};

export function evaluate(
  tableName: string,
  registry: Registry,
  rng?: () => number       // default: Math.random
): EvalResult;
```

**Recursion safety.** Circular references are possible in principle (Table A → Table B → Table A). Cap recursion depth at 100 and throw a clean error message if exceeded.

---

## 7. UI Specification

### Layout (desktop)

Two-column layout:
- **Left column (30%):** file dropzone, list of loaded files with a remove button each, and a list of clickable table names.
- **Right column (70%):** currently-selected table name, a **Generate** button, the rendered result, and a scrollable history of past results (most recent first).

### Layout (mobile)

Stacked: dropzone on top, table list, result below.

### Interactions

1. **Load files.** Drag-and-drop OR click to pick. Accept only `.ipt` extension. Reject silently with a toast on wrong extension.
2. **Pre-loaded examples.** On first load, if no files are uploaded, auto-load the examples from `public/examples/` so the user has something to try immediately.
3. **Select a generator.** Click a table name in the list. It becomes the "active" generator.
4. **Generate.** A big button runs the active generator. The result renders in the right panel and is prepended to the history.
5. **Keyboard shortcut:** `Enter` or `Space` when focus is on the Generate button (native). `R` globally = run active generator again.
6. **Copy result.** Each result in the history has a "Copy" button that copies the plain-text (not HTML) version to the clipboard.
7. **Clear history.** Button to clear the history.
8. **Syntax help.** A small collapsible panel with a 10-line reference on the supported syntax.

### Styling notes
- Clean, neutral. Avoid theming it as a game UI — it's a tool.
- Dark mode supported via Tailwind's `dark:` prefix.
- Monospace font for the result (entries often contain visual formatting that depends on alignment).

---

## 8. Implementation Order

Suggested build order — each step should leave the app in a working state:

1. **Scaffold.** `npm create vite@latest ipt-web -- --template react-ts`, install Tailwind, verify dev server runs.
2. **Core types.** Write `types.ts` with the full AST.
3. **Parser.** Implement `parse()` for: `Table:` declarations, entries, and simple `[@Ref]` references. Test manually in a Vitest-less console log from `App.tsx`.
4. **Registry.** Implement the `Registry` class.
5. **Evaluator (minimal).** Implement `evaluate()` with only simple refs working.
6. **Minimal UI.** Textarea to paste `.ipt` content, a dropdown of tables, a button, a result div. No styling yet.
7. **Multi-file loading.** Replace the textarea with a file dropzone. Support Windows-1252 decoding.
8. **Add `[!N Table >> filter]` parsing and evaluation** with `implode`.
9. **Add HTML entity decoding** for references and table names.
10. **Polish UI.** Tailwind styling, history, copy button, mobile layout.
11. **Pre-load examples.** Ship 2–3 example `.ipt` files in `public/examples/`.
12. **README and LICENSE.** Write a clear README with screenshots.
13. **Deploy.** GitHub Pages via `vite-plugin-gh-pages` or Vercel.

---

## 9. Edge Cases & Gotchas

1. **Encoding.** Files are Windows-1252. `readAsText(file, 'windows-1252')`. Getting this wrong means all accented characters (`é`, `à`, `ç`…) come out as `�` or mojibake.
2. **Line endings.** Mix of `\r\n` and `\n`. Normalize to `\n` after reading, before parsing.
3. **Trailing whitespace on entries.** Strip trailing whitespace from each entry line (preserve leading whitespace — it can be meaningful in generated output).
4. **The literal string `\n` inside entries is not the same as a real newline.** Real newlines in the source separate entries. The literal two-character sequence `\n` inside a single entry is an escape that becomes a newline in the output.
5. **HTML entity table names.** The table `Table: ♀` in one file may be referenced from another file as `[&#x2640]`. The registry must normalize both to the same key.
6. **Duplicate table names across files.** Last loaded wins, warn to console.
7. **Circular references.** Recursion depth cap (100).
8. **Empty tables.** If a table has zero entries (possible if the file is malformed), generating it returns an empty string and logs a warning.
9. **`[!N Table]` where `N > size(Table)`.** Return all entries shuffled, no duplicates, no crash.
10. **Whitespace-only entries.** Skip.
11. **BOM.** If the file starts with a UTF-8 BOM (`EF BB BF`) or Windows-1252 equivalent, strip it.

---

## 10. Acceptance Criteria

The app is v1-complete when all of the following hold:

- [ ] User can drag-and-drop one or more `.ipt` files.
- [ ] User can see a list of all tables across all loaded files.
- [ ] User can click a table and generate output.
- [ ] Generated output renders HTML tags (`<b>`, `<i>`) correctly.
- [ ] Generated output renders `\n` escapes as visible line breaks.
- [ ] Multi-pick with `implode` produces a comma-separated list.
- [ ] Cross-file references resolve correctly.
- [ ] Accented French characters render correctly (encoding is right).
- [ ] No runtime errors on any of the 7 real-world test files (see §11).
- [ ] App is deployed and accessible via a public URL.
- [ ] README explains how to use the app and how to write a basic `.ipt` file.

---

## 11. Test Cases

### 11.1 Minimal smoke test

```ipt
Table: Hello
World
Friend
Stranger

Table: Greeting
Hello, [@Hello]!
```

Running `Greeting` should produce one of: `Hello, World!` / `Hello, Friend!` / `Hello, Stranger!`.

### 11.2 Real-world corpus

The following files were provided by the original author as representative samples. They should all load without errors and every declared generator in each should be runnable:

- `Aleamundi.ipt` — exercises `Table:`, `[@...]`, `[!N ... >> implode]`, `\n` escapes.
- `Aleamundi-Aventure.ipt`
- `Aventures_One-shot.ipt`
- `Bac-A-Sable.ipt` — heavy cross-references, large generator output.
- `Campagne_7hex.ipt` — exercises 7 sequential picks from the same table.
- `Créatures.ipt` — heavy HTML tag usage.
- `Figurants.ipt` — exercises `[&#x2640]` / `[&#x2642]` entity-as-tablename references.

### 11.3 Key parser assertions

Given:
```ipt
Table: Test
<b>[@Sub]</b>\nDone

Table: Sub
alpha
beta
```

Running `Test` must produce output of the form `<b>alpha</b>` + newline + `Done` OR `<b>beta</b>` + newline + `Done`.

### 11.4 Multi-pick assertion

Given:
```ipt
Table: Wrap
Colors: [!2 Color >> implode]

Table: Color
red
green
blue
```

Running `Wrap` must produce one of:
- `Colors: red, green`
- `Colors: red, blue`
- `Colors: green, red`
- `Colors: green, blue`
- `Colors: blue, red`
- `Colors: blue, green`

Never `Colors: red, red`.

---

## 12. Deployment

- Configure Vite `base` for GitHub Pages if using that (repo-name subpath) or leave as `/` for Vercel.
- Add a GitHub Actions workflow to build and deploy on push to `main`.
- Include a `CNAME` file if a custom domain is used.

---

## 13. README Requirements

The README must include:
1. One-paragraph project description.
2. Live demo URL.
3. Screenshot or animated GIF.
4. "What is a `.ipt` file?" section with a minimal example.
5. Supported syntax (link to §5 of this spec or inline).
6. Local development instructions.
7. Clear statement: "This is not affiliated with NBOS Software. `.ipt` is a file format originally created for Inspiration Pad Pro; this project is an independent reimplementation."
8. License (MIT).
9. Contributions welcome section with notes on future extensions.

---

## 14. Questions the Implementer Should NOT Ask Back

To keep velocity high, make these decisions without asking:

- File naming conventions (use standard React conventions).
- Exact Tailwind color palette (pick something neutral — slate/stone).
- Component splitting below the top level (use judgement).
- Whether to use functional or class components (functional + hooks).
- Exact copy for UI labels (write something reasonable in French and English; default to English if unsure).
- Animation library (none needed).

## 15. Questions that DO warrant clarification

Ask the human if:
- A real `.ipt` file in the test corpus uses a syntax not covered by §5.
- The encoding assumption (Windows-1252) fails for some provided file.
- A decision would meaningfully change the scope (e.g. "should I add persistence?" — default: no).

---

## 16. Out of Scope — Do Not Build

Explicit list of things to not build in v1, even if tempted:
- Dice expressions (`{1d6}`, `{2d10+3}`).
- Variable assignment and reference (`{x=...}`, `{x}`).
- Mathematical expressions inside `{}`.
- Weighted table entries (e.g. `3, Orc`).
- Filters other than `implode`.
- A `.ipt` editor with syntax highlighting.
- LocalStorage persistence.
- Server-side anything.
- User accounts.
- Sharing / collaboration features.
- A mobile-native app.
- Translation UI (the `.ipt` files themselves may be in any language — the UI can be French or English, pick one).

---

## Appendix A — Minimal `.ipt` Example for the Repo

Ship this in `public/examples/hello.ipt`:

```ipt
Table: Hello
<b>Greetings from IPT Web!</b>\nYou rolled: [@Color] [@Animal]

Table: Color
red
green
blue
purple
golden

Table: Animal
fox
cat
dragon
turtle
owl
```
