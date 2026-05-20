# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev server

```bash
bash scripts/00_start_dev.sh          # serves on localhost:8000
bash scripts/00_start_dev.sh 3000     # custom port
```

Requires Node.js (`npx serve`). The app **must** be served via HTTP — opening `index.html` directly as a `file://` URL breaks `fetch()` and renders an error row.

## Stack

Vanilla HTML5/CSS3/JS (ES2020). No build step, no bundler, no framework. Everything ships as-is to the browser.

## Architecture

The entire frontend logic lives in `js/dashboard.js`. Data flows in one direction:

1. **Boot** — `fetch('data/manifest.json')` loads the person list → renders person selector buttons (`#pessoas`).
2. **Person selected** (`loadPerson`) — fetches `data/{folder}/manifest.json` → renders month selector buttons (`#months`), then auto-loads the last month.
3. **Month loaded** (`loadFile`) — fetches `data/{folder}/{file}` (filename from the manifest) → populates `allData[]`, injects per-category badge CSS, renders summary cards and the transaction table.
4. **Filter / sort** — purely in-memory operations over `allData[]`; `render()` recalculates from `filtered()` on every interaction.

Global mutable state: `allData`, `activeFilter`, `sortCol`, `sortDir`, `currentFolder` (declared at top except `currentFolder`, which is declared just before `loadFile`).

Category badge colors are assigned by index into `PALETTE` (15 entries, cycles). The CSS rules are injected dynamically per dataset via `injectBadgeStyles()`, replacing any previous `<style>` tag.

## Data layer (not versioned)

`data/` is git-ignored (financial data). The manifest hierarchy:

- `data/manifest.json` → lists persons: `{ "pessoas": [{ "label", "folder" }] }`
- `data/{folder}/manifest.json` → lists months: `{ "arquivos": [{ "label", "file" }] }`
- `data/{folder}/{file}` → transaction file referenced by the month manifest (filename is arbitrary, e.g. `2026-05.json` or `2026-05_debito.json`)

Each transaction file has three top-level keys:
- `meta` — `{ titular, bancos[], contas[], periodo: { inicio, fim }, gerado_em }`
- `categorias_validas[]` — canonical order for filter buttons; categories in transactions but absent here are appended at the end
- `lancamentos[]` — each entry: `data` (ISO), `nome_original`, `nome_simplificado`, `categoria`, `valor` (number, negative = expense), `origem`, and optionally `parcela_atual` / `parcelas_total` (integers, for installment transactions)

**Investimento category** is treated specially: excluded from the Entradas/Saídas/Saldo summary cards, and its value is always rendered as a neutral absolute amount in the table (no +/− sign, no color).

## Adding data

- **New month**: create `data/{pessoa}/YYYY-MM.json` (filename is free, just match it in the manifest) and add its entry to `data/{pessoa}/manifest.json`.
- **New person**: create `data/{pessoa}/` with its files and manifest, then add the person to `data/manifest.json`.
