# The PC — Visual Computer embed

Jackie's left menu ("The PC" section) opens the full Visual Computer from the
[`93jessycollin93-del/PC`](https://github.com/93jessycollin93-del/PC)
repository, embedded whole at the `/pc` route. Nothing about the PC is
rewritten or compromised: its production build ships as static files under
`public/pc-os/` and runs in an iframe with its own React runtime, apps,
window manager and persistence.

## How it works

- `src/pages/PCDesktop.tsx` renders `/pc-os/index.html?pc=full` in a
  full-height iframe under a slim Jackie header (back, reload,
  open-in-new-tab).
- Deep links: `/pc?app=<pc-app-id>` boots the PC with that app open.
  The PC reads `?app=` / `?pc=` on boot (see `App.tsx` in the PC repo).
  Menu entries use e.g. `/pc?app=jacky`, `/pc?app=security_center`.
- The PC detects it is inside an iframe and skips both IndexedDB (falls back
  to localStorage) and service-worker registration, so it never fights
  Jackie's PWA.
- Jackie's service worker excludes `/pc-os/**` from precache (`globIgnores`)
  and from the SPA navigation fallback (`navigateFallbackDenylist`); the
  runtime `CacheFirst` rule still caches the PC assets after first use (see
  `vite.config.ts`). Both exclusions are load-bearing, not tidiness: the PC
  carries a 21.6 MB on-device AI wasm, and without `globIgnores`
  `vite-plugin-pwa` **fails the build outright** rather than warning. Without
  the denylist, navigating to the embed serves Jackie's SPA shell and the
  iframe renders Jackie inside Jackie.

  The `.wasm` extension is deliberately absent from the runtime `CacheFirst`
  pattern. Adding it would make the PC's on-device AI work offline inside
  Jackie at the cost of a 21.6 MB cache entry the moment anyone opens that app
  — a real trade, worth making on purpose rather than by accident.

## Refreshing the embedded build

When the PC repo changes, rebuild and re-copy:

Always rebuild Jackie afterwards to prove the embed did not break it — see the
per-file precache note above for what happens when it does.

```sh
# in the PC repo
npm install
npm run build:pc-os          # vite build --base=/pc-os/ + manifest patch

# in this repo
rm -rf public/pc-os && mkdir -p public/pc-os
cp -r ../PC/dist/* public/pc-os/
```

Commit the refreshed `public/pc-os/` files.

## Known limitations

- The PC styles itself with the Tailwind Play CDN at runtime (same as its
  own production deployment). Offline or on networks that block
  `cdn.tailwindcss.com`, the PC renders unstyled. Compiling Tailwind into
  the PC build would remove that dependency — tracked as a follow-up in the
  PC repo.
- The PC's AI features call `/api/gemini/generate`, which exists only when
  the PC runs behind its own Express server. Inside Jackie those calls fail
  gracefully; every non-AI app works normally.
