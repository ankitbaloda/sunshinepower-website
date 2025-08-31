
# Sunshine Power — Astro + Netlify + Codespaces Starter

**Why Astro?** Fast, SEO‑friendly, zero‑JS by default. Perfect for Netlify.  
**Why Codespaces?** Edit in the browser, no setup. Devcontainer already included.

## Quick Start (GitHub → Codespaces → Netlify)

1. Create a new GitHub repo and upload these files (or import the zip).  
2. Click **Code → Create codespace on main**.  
3. In the terminal, run:
   ```bash
   npm run dev
   ```
   Open the forwarded port (4321) to preview.
4. In Netlify: **Add new site → Import from Git → choose this repo**.  
   Build command: `npm run build` • Publish directory: `dist` • Enable HTTPS.

## Edit content
- Pages: `src/pages/*.astro`
- Layout: `src/layouts/Base.astro`
- Styles: `src/styles.css`
- Logo: replace `public/assets/logo.svg`
- WhatsApp number: `src/components/WhatsAppFab.astro`

## Forms
Both Contact and Quote are Netlify Forms enabled (`data-netlify="true"`). View submissions in Netlify → Forms.
