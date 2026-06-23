# frontend

Preact + Vite SPA served behind nginx. Dark-themed chat interface for the Helping People platform.

## Routes

| Path | Component | Auth |
|------|-----------|:----:|
| `/login` | LoginPage | No |
| `/signup` | SignupPage | No |
| `/` | LandingPage | No (renders `ModeChooser` if logged in, hero if not) |
| `/chat` | ChatPage | Yes (renders `ModeChooser` when no `?mode=` query param; otherwise shows intake chat) |
| `/find` | FindPage | Yes (always `mode: search`) |
| `/inbox` | InboxPage | Yes (DM thread list) |
| `/inbox/:convId` | DirectMessagePage | Yes (DM thread + actions) |
| `/workers/:workerId` | WorkerContactPage | Yes (creates/resumes DM conversation with worker, redirects to `/inbox/:convId`) |
| `/admin` | AdminPage | Yes |
| `/admin/llm` | AdminLLMPage | Yes (LLM provider dropdown) |
| `/admin/prompts` | AdminPromptsPage | Yes (4-prompt textarea editor) |
| `/admin/users` | UsersPage | Yes (admin) |
| `/admin/users/:id` | UserDetailPage | Yes (admin) |
| `/admin/worker-profiles` | WorkersPage | Yes (admin) |
| `/admin/worker-profiles/:id` | WorkerDetailPage | Yes (admin) |
| `/admin/client-profiles` | ClientsPage | Yes (admin) |
| `/admin/client-profiles/:id` | ClientDetailPage | Yes (admin) |
| `/admin/conversations` | ConversationsPage | Yes (admin) |
| `/admin/conversations/:id` | ConversationDetailPage | Yes (admin) |
| `/admin/messages` | MessagesPage | Yes (admin) |
| `/admin/messages/:id` | MessageDetailPage | Yes (admin) |

## Conventions

- Preact with `preact-router` v4 client-side routing
- `AuthProvider` context wraps app → exposes `useAuth()`: `session`, `loading`, `sendMagicLink`, `logout`, `refreshSession`
- API calls use relative URLs (`/api/v1/...`, `/api/auth/...`) — proxied by Traefik; no Vite proxy config needed
- Console logging with component prefixes: `[Chat]`, `[Admin]`, `[Auth]`, `[Nav]`, `[ModeChooser]`
- CSS-in-JS via `<style>` tags in each component; `src/style.css` is the shared design system
- Worker profile stores arrays as JSON fields (certifications, languages, social_links)
- `index.html` imports `/src/main.tsx`
- Session cookie name: `better-auth.session_token` (set by Better Auth over HTTP in dev). In production (HTTPS), Better Auth sets the `__Secure-better-auth.session_token` variant. Backend's `AuthMiddleware` accepts both forms.

## Auth flow

- `/api/auth/get-session` — session check on mount & route change
- `/api/auth/sign-in/magic-link` — POST with `{ email, callbackURL: '/', metadata: { lang } }`
- `/api/auth/sign-out` — POST (best-effort, credentials: include)
- `ProtectedRoute` redirects to `/login` if no session; shows "Checking authentication..." while loading

## Dev

```bash
npm install
npm run dev          # Vite HMR on :5173
npm run build        # production → dist/
npm run preview      # preview production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint src/ tests/
npm run test         # vitest (watch)
npm run test:coverage  # vitest run --coverage
npm run test:unit    # vitest run tests/unit
npm run test:integration  # vitest run tests/integration
npm run test:e2e     # playwright test
```

## Docker

```bash
docker build -t ghcr.io/helpingpeoplenow/frontend:latest .
```

Multi-stage: `node:20-alpine` build → `nginx:alpine` runtime. CI pipeline (`.github/workflows/ci.yml`): lint → typecheck → vitest (unit + integration) → Playwright e2e → docker build/push to ghcr. Subsumes the old `docker.yml`.

## Direct Messaging

- **Flow**: FindPage → click WorkerCard → `/workers/:workerId` → `WorkerContactPage` calls `GET /api/v1/workers/:id/contact` → redirects to `/inbox/:convId` → `DirectMessagePage`
- **API client**: `src/lib/directMessageApi.ts` — wraps all DM endpoints with `fetchJSON` (credentials: include)
- **SSE**: `src/lib/sse.ts` — `DirectMessageSSE` class: opens EventSource on `/api/v1/direct-messages/stream`, falls back to polling (`/since`) after 3+ consecutive failures, exponential backoff reconnect
- **Store**: `src/store/directMessages.ts` — Zustand store. `connect()` starts SSE listener, `addMessage()` appends inbound messages to the correct thread and increments unread
- **Status indicator**: InboxPage shows a colored dot: green (open), yellow (connecting), cyan (polling), red (disconnected)
- **Rate limiting**: `sendMessage()` in store catches 429 responses, sets `rateLimited: true` with 5s auto-clear. DirectMessagePage shows ⏳ banner.
- **Block/Report**: DirectMessagePage has ⋯ action menu with Archive, Block, Report. Block shows confirmation dialog in red, report in warning. Archive navigates to /inbox.
- **WorkerCard**: Made clickable in Phase 2 — `onClick` calls `route('/workers/:id', false)` (pushState for back button support)

## Gotchas

- `ChatPage` reads `mode` from `window.location.search` (`?mode=worker_intake`, `?mode=client_intake`, `?mode=search`)
- `ChatPage` shows `ModeChooser` when no `?mode=` query param is present
- `FindPage` hardcodes `mode: 'search'` and renders worker cards grid
- `ModeChooser` shows three buttons for authenticated users: "I am a Worker" / "Soy Trabajador", "I am a Client" / "Soy Cliente", "Find a Professional"
- `LandingPage` shows a welcome page with `ModeChooser` for logged-in users, hero section for visitors
- AdminPage also has a link to Adminer (DB admin tool) at `/adminer`
- `useLanguage()` hook returns `{ lang, setLang, t }`. Spanish is the default language. All chat requests include `lang` in body so the backend instructs AI to respond in the matching language.
- nginx SPA fallback: `try_files $uri $uri/ /index.html`
- `src/services/profiles.ts` is dead code — no component imports its functions. Profile read/reset happens via the chat handlers. Slated for removal.
- `useDirectMessages` exposes a `tallyUnread(convId)` action that is never called by any component. Slated for removal.
- `@types/react` and `@types/react-dom` are in `devDependencies` but the project uses Preact, not React. Slated for removal.
- `ErrorBoundary` wraps all `<ProtectedRoute>` chains in `App.tsx` — no functional tests cover the error path today.
