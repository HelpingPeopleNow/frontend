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
- Console logging with component prefixes: `[Chat]`, `[Admin]`, `[Auth]`, `[Nav]`, `[Worker]`, `[Client]`
- CSS-in-JS via `<style>` tags in each component; `src/style.css` is the shared design system
- Worker profile stores arrays as JSON fields (certifications, languages, social_links)
- `index.html` imports `/src/main.jsx` (Vite resolves `.tsx` internally)
- Session cookie name: `better-auth.session_token` (expected by backend's `extractUserIDFromRequest`)
- WorkerPage and ClientPage use read-only profile cards — no manual forms. All data comes from chat via `[FIELDS]` extraction
- Both pages load previous conversations on mount from `GET /api/v1/conversations?type=worker|client&limit=1`
- Profile reset uses `DELETE /api/v1/worker/profile` or `DELETE /api/v1/client/profile`
- ClientPage has new fields: `preferred_contact`, `property_type`, `notes`

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

- ChatPage supports both JSON (default) and SSE streaming (content-type `text/event-stream`)
- After role detection (`detected_role` in JSON response), ChatPage replaces the chat input with a profile/request button
- AdminPage also has a link to Adminer (DB admin tool) at `/adminer`
- nginx SPA fallback: `try_files $uri /index.html`
- `PromptsPage.tsx` and `api.ts` were deleted in the latest commit (not present in codebase)
