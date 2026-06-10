# frontend

Preact + Vite SPA served behind nginx. Dark-themed chat interface for the HelpingPeopleNow platform.

## Routes

| Path | Component | Auth |
|------|-----------|:----:|
| `/login` | LoginPage | No |
| `/signup` | SignupPage | No |
| `/` | ChatPage | Yes |
| `/admin` | AdminPage | Yes |
| `/worker` | WorkerPage | Yes |
| `/client` | ClientPage | Yes |

## Conventions

- Preact with `preact-router` v4 client-side routing
- `AuthProvider` context wraps app → exposes `useAuth()`: `session`, `loading`, `sendMagicLink`, `logout`, `refreshSession`
- API calls use relative URLs (`/api/v1/...`, `/api/auth/...`) — proxied by Traefik; no Vite proxy config needed
- Console logging with component prefixes: `[Chat]`, `[Admin]`, `[Auth]`, `[Nav]`
- CSS-in-JS via `<style>` tags in each component; `src/style.css` is just a reset
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

- `PromptsPage.tsx` and `api.ts` are legacy/unused — not imported in `App.tsx`
- ChatPage supports both JSON (default) and SSE streaming (content-type `text/event-stream`)
- After role detection (`detected_role` in JSON response), ChatPage replaces the chat input with a profile/request button
- AdminPage also has a link to Adminer (DB admin tool) at `/adminer`
- nginx SPA fallback: `try_files $uri /index.html`
