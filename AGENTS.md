# frontend

Preact + Vite SPA served behind nginx. Dark-themed chat interface for the HelpingPeopleNow platform.

## Routes

| Path | Component | Auth |
|------|-----------|:----:|
| `/login` | LoginPage | No |
| `/signup` | SignupPage | No |
| `/` | LandingPage | No (redirects to `/chat` if logged in) |
| `/chat` | ChatPage | Yes |
| `/find` | FindPage | Yes |
| `/admin` | AdminPage | Yes |

## Conventions

- Preact with `preact-router` v4 client-side routing
- `AuthProvider` context wraps app → exposes `useAuth()`: `session`, `loading`, `sendMagicLink`, `logout`, `refreshSession`
- API calls use relative URLs (`/api/v1/...`, `/api/auth/...`) — proxied by Traefik; no Vite proxy config needed
- Console logging with component prefixes: `[Chat]`, `[Admin]`, `[Auth]`, `[Nav]`, `[ModeChooser]`
- CSS-in-JS via `<style>` tags in each component; `src/style.css` is the shared design system
- Worker profile stores arrays as JSON fields (certifications, languages, social_links)
- `index.html` imports `/src/main.jsx` (Vite resolves `.tsx` internally)
- Session cookie name: `better-auth.session_token` (expected by backend's `extractUserIDFromRequest`)

## Auth flow

- `/api/auth/get-session` — session check on mount & route change
- `/api/auth/sign-in/magic-link` — POST with `{ email, name?, callbackURL: '/' }`
- `/api/auth/sign-out` — POST (best-effort, credentials: include)
- `ProtectedRoute` redirects to `/login` if no session; shows "Checking authentication..." while loading

## Dev

```bash
npm install
npm run dev          # Vite HMR on :5173
npm run build        # production → dist/
npm run preview      # preview production build
npm run typecheck    # tsc --noEmit
```

## Docker

```bash
docker build -t ghcr.io/helpingpeoplenow/frontend:latest .
```

Multi-stage: `node:20-alpine` build → `nginx:alpine` runtime. CI builds + pushes on push to `main`.

## Gotchas

- `ChatPage` reads `mode` from `window.location.search` (`?mode=worker_intake`, `?mode=client_intake`, `?mode=search`)
- `ChatPage` shows `ModeChooser` when no `?mode=` query param is present
- `FindPage` hardcodes `mode: 'search'` and renders worker cards grid
- `ModeChooser` shows three buttons for authenticated users: "Set Up as a Worker", "Set Up as a Client", "Find a Professional"
- `LandingPage` redirects logged-in users to `/chat`
- AdminPage also has a link to Adminer (DB admin tool) at `/adminer`
- nginx SPA fallback: `try_files $uri /index.html`
- `/worker` and `/client` routes are removed — visiting them shows blank pages (no SPA route match)
