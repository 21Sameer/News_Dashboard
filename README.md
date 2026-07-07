# News Dashboard (NewsDash)

Real-time news intelligence dashboard built with Next.js. Aggregates headlines from 360+ RSS feeds across technology, markets, and global news.

## Requirements

- **Node.js 20+** (required for Next.js 16)
- **npm 10+**

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/21Sameer/News_Dashboard.git
cd News_Dashboard

# 2. Install dependencies (required — do not skip)
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **First load note:** The dashboard fetches live RSS feeds on first visit. The home page may show a brief "Syncing…" message for 10–30 seconds while feeds warm up. Category pages (Tech, Crypto, etc.) load faster after the first sync.

## Production Build

```bash
npm run build
npm start
```

## Deploy on Vercel

The repo includes `vercel.json`. Connect the GitHub repo to Vercel — no extra config needed.

Live demo: [news-dashboard-six-indol.vercel.app](https://news-dashboard-six-indol.vercel.app)

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Sidebar shows but main area is blank | Run `npm install`, then hard-refresh (`Ctrl+Shift+R`). Ensure Node.js 20+. |
| Layout looks broken (stacked vertically) | Pull the latest `main` branch — CSS layout fix is included. |
| No news appearing | Wait 30s for feeds to load, or check your network allows RSS fetch. |
| `npm run dev` fails | Delete `node_modules` and `.next`, then run `npm install` again. |
