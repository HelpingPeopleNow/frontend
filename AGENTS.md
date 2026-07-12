# frontend

Preact + Vite SPA served behind nginx. Dark-themed chat interface for the Helping People platform.

## Routes

| Path | Component | Auth |
|------|-----------|:----:|
| `/login` | LoginPage | No (magic-link login + signup) |
| `/terms` | TermsPage | No (bilingual EN/ES terms and conditions) |
| `/privacy` | PrivacyPage | No (bilingual EN/ES privacy policy) |
| `/cookies` | CookiesPage | No (bilingual EN/ES cookie policy) |
| `/` | LandingPage | No (renders `ModeChooser` if logged in, hero + latest professionals if not) |
| `/profile/:slug` | PublicProfilePage | No (public worker profile page with hero, stats, bio, links, CTA) |
| `/chat` | ChatPage | Yes (renders `ModeChooser` when no `?mode=` query param; otherwise shows intake chat for `worker_intake` or `client_intake`) |
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
| `/admin/feedback` | FeedbackAdminPage | Yes (admin) |

## Conventions

- Preact with `preact-router` v4 client-side routing
- `AuthProvider` context wraps app → exposes `useAuth()`: `session`, `loading`, `sendMagicLink`, `logout`, `refreshSession`
- Centralized logger: `src/lib/logger.ts` — `createLogger(prefix)` returns a scoped `console.log/warn/error` wrapper. All 16 component prefixes are defined here.
- API calls use relative URLs (`/api/v1/...`, `/api/auth/...`) — proxied by Traefik; no Vite proxy config needed
- Console logging with component prefixes: `[Chat]`, `[Auth]`, `[Admin]`, `[DM]`, `[Nav]`, `[ModeChooser]`, `[API]`, `[SSE]`, `[Inbox]`, `[Thread]`, `[Speech]`, `[App]`, `[Profile]`, `[Landing]`, `[Feedback]`, `[Geo]`
- Public profile API client: `src/lib/publicProfileApi.ts` — `fetchPublicProfile(slug)` + `fetchLatestProfiles(limit)`, types `WorkerPublicProfile` and `SocialLink`
- CSS-in-JS via `<style>` tags in each component; `src/style.css` is the shared design system
- Worker profile stores arrays as JSON fields (certifications, languages, social_links)
- `index.html` imports `/src/main.tsx`
- Session cookie name: `better-auth.session_token` (set by Better Auth over HTTP in dev). In production (HTTPS), Better Auth sets the `__Secure-better-auth.session_token` variant. Backend's `AuthMiddleware` accepts both forms.

## Auth flow

- `/api/auth/get-session` — session check on mount & route change (Better Auth default endpoint)
- `/api/auth/sign-in/magic-link` — POST with `{ email, callbackURL: '/', metadata: { lang, capToken } }`
- `sendMagicLink(email, capToken, lang)` — AuthProvider method; constructs the POST body with `capToken` in `metadata` for bot protection
- `/api/auth/sign-out` — POST (best-effort, credentials: include)
- `ProtectedRoute` redirects to `/login` if no session; shows "Checking authentication..." while loading

## Cap CAPTCHA

- **Provider**: [Cap](https://cap.helpingpeople.cloud) — open-source CAPTCHA service
- **Widget**: `<cap-widget>` custom element embedded on `LoginPage` and `PublicProfilePage` (for the contact-CTA `getContact` flow)
- **Token delivery**: `capToken` is obtained from the widget and sent:
  - In `metadata.capToken` when calling `sendMagicLink` (magic-link login/signup)
  - As a `?capToken=` query parameter when calling `GET /api/v1/workers/:id/contact` (public profile CTA)
- **CSP requirements**: The Content-Security-Policy in `nginx.conf` must allow:
  - `script-src` / `worker-src`: `cap.helpingpeople.cloud` and `wasm-unsafe-eval`
  - `connect-src`: `cap.helpingpeople.cloud`

## Dev

```bash
npm install
npm run dev          # Vite HMR on :5173
npm run build        # production → dist/
npm run preview      # vite preview (serves built dist/)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint src/
```

## Tests

```bash
npm run test:coverage  # vitest run --coverage (unit + integration; jsdom env)
npm run test:e2e       # playwright test (uses built dist/)
npx vitest             # vitest watch (no npm script for plain `test`)
```

Vitest is configured in `vitest.config.ts` (jsdom env, `tests/**/*.test.{ts,tsx}` glob, v8 coverage excluding `src/main.tsx` and `*.d.ts`). Coverage thresholds: lines 75%, branches 75%, functions 78%, statements 75%.

Playwright config in `playwright.config.js`; only `e2e/deploy.spec.js` exists (deploy-smoke).

## Docker

```bash
docker build -t ghcr.io/helpingpeoplenow/frontend:latest .
```

Multi-stage: `node:22-alpine` build → `nginx:alpine` runtime. The stage-2 image runs as the unprivileged `nginx` user (audit P2-1) and listens on **port 8080** (not 80) so non-root can bind; the Dockerfile `sed`-transforms the baked `listen 80` directive. A `HEALTHCHECK` polls `http://127.0.0.1:8080/` every 30 s. `.dockerignore` covers `.git`, `*.env`, `node_modules`, `dist`, `coverage`, `test-results`, `playwright-report`, `*.log`. Container name is `helpingpeoplenow-frontend` in compose; the **infra** repo's `docker-compose.yml` + `docker-compose-dev.yaml` + `nginx-default.conf` are coordinated on port 8080 (`loadbalancer.server.port=8080`, `expose: 8080`). CI pipeline (`.github/workflows/ci.yml`): lint → typecheck → vitest (unit + integration) → Playwright e2e → docker build/push to ghcr.

## Direct Messaging

- **Flow**: FindPage → click WorkerCard → `/workers/:workerId` → `WorkerContactPage` calls `GET /api/v1/workers/:id/contact` → redirects to `/inbox/:convId` → `DirectMessagePage`
- **API client**: `src/lib/directMessageApi.ts` — wraps all DM endpoints with `fetchJSON` (credentials: include)
- **SSE**: `src/lib/sse.ts` — `DirectMessageSSE` class: opens EventSource on `/api/v1/direct-messages/stream`, falls back to polling (`/since`) after 3+ consecutive failures (mutually exclusive transport — polling STOPS when SSE reconnects), exponential backoff reconnect. All `JSON.parse` calls are guarded by `safeParse`; malformed frames are dropped + logged, never crash the stream. Poll fetches use `AbortSignal.timeout(POLL_TIMEOUT_MS = POLL_INTERVAL_MS * 2 = 8s)`.
- **Store**: `src/store/directMessages.ts` — Zustand store. `connect()` starts SSE listener, `addMessage()` appends inbound messages to the correct thread and increments unread
- **Status indicator**: InboxPage shows a colored dot: green (open), yellow (connecting), cyan (polling), red (disconnected)
- **Rate limiting**: `sendMessage()` in store catches 429 responses, sets `rateLimited: true` with 5s auto-clear. DirectMessagePage shows ⏳ banner.
- **Block/Report**: DirectMessagePage has ⋯ action menu with Archive, Block, Report. Block shows confirmation dialog in red, report in warning. Archive navigates to /inbox.
- **WorkerCard**: Made clickable in Phase 2 — `onClick` calls `route('/workers/:id', false)` (pushState for back button support)

## Feedback system

In-app feedback widget with admin dashboard for triaging user submissions.

- **API client**: `src/lib/feedbackApi.ts` — `submitFeedback({ message, page_url, category })`. Types: `Feedback`, `FeedbackCategory`.
- **FeedbackWidget**: `src/components/feedback/FeedbackWidget.tsx` — Fixed-position FAB (bottom-right, 💬 icon). Clicking opens/closes a `FeedbackPopover`. Hidden on `/admin/*` pages. Mounted in `App.tsx` alongside `CookieConsent`.
- **FeedbackPopover**: `src/components/feedback/FeedbackPopover.tsx` — Form with 4 category buttons (🐛 Bug, 💡 Idea, 😤 Complaint, 💬 General), textarea (1–2000 chars), character counter, submit button. Shows ✅ success toast on submit, then auto-resets after 2s.
- **FeedbackAdminPage**: `src/FeedbackAdminPage.tsx` — Admin-only page at `/admin/feedback`. Lists all feedback submissions with status filter dropdown. Each card shows category emoji, status (color-coded), message, page URL, user ID (truncated), and status update buttons. Uses `AppShell` layout. Route added in `App.tsx`, link added in `AdminPage.tsx`.
- **CSS-in-JS**: All styles in `<style>` tags within each component — no external CSS files. Uses design tokens (`var(--surface)`, `var(--accent)`, `var(--text-secondary)`, etc.).

## GPS Geolocation

- **Hook**: `src/hooks/useGeolocation.ts` — wraps the browser `navigator.geolocation` API. Returns `{ latitude, longitude, loading, permissionDenied, error }`. Uses `maximumAge: 300000` (5 min cache) so the browser reuses recent fixes. Falls back gracefully: if `navigator.geolocation` is unsupported or permission is denied, `permissionDenied` / `error` are set; pages degrade to showing results without distance ranking.
- **Types**: `ChatRequest` in `src/services/chat.ts` now accepts optional `latitude?: number` and `longitude?: number`. `WorkerCard` interface gains optional `latitude?: number`, `longitude?: number`, and `distance_km?: number` — the backend computes distance and returns it with worker search results.
- **useChat**: `src/hooks/useChat.ts` accepts `latitude` and `longitude` in `UseChatOptions` and conditionally spreads them into the `sendChat()` POST body (only when both are non-null).
- **ChatPage**: Calls `useGeolocation()` on mount. Passes `geo.latitude` / `geo.longitude` to `useChat()`. When `geo.permissionDenied` is true, renders a `<div class="location-banner">` with a 📍-prefixed message using `t('chat.location.denied')`.
- **FindPage**: Also calls `useGeolocation()`. In its `send()` function, spreads `{ latitude, longitude }` into the `sendChat()` call (mode `'search'`) when coords are available. Shows the same `.location-banner` when permission is denied.
- **WorkerCard display**: `src/components/chat/WorkerCard.tsx` renders ` · 📍 X.X km` inline when `worker.distance_km != null`. Values <1 km show as `<1 km`. The distance segment is wrapped in a `span.worker-card-distance`.
- **CSS**: `.location-banner` in `src/style.css` — blue gradient background (`#1e3a5f → #2d5a88`), centered white text, `padding: var(--sp-3) var(--sp-4)`, `border-radius: var(--sp-2)`. `.location-banner-text` applies `opacity: 0.95`.
- **i18n**: Key `chat.location.denied` exists in both EN and ES translations in `src/i18n.ts`. EN: *"Location access helps us find the closest traders near you. You can enable it in your browser settings."* ES: *"El acceso a la ubicación nos ayuda a encontrar los trabajadores más cercanos. Puedes activarlo en la configuración de tu navegador."*

## Gotchas

- `ChatPage` reads `mode` from `window.location.search` (`?mode=worker_intake`, `?mode=client_intake`) — does NOT accept `?mode=search` (search is the dedicated `/find` route)
- `ChatPage` shows `ModeChooser` when no `?mode=` query param is present
- `FindPage` hardcodes `mode: 'search'` and renders worker cards grid
- `ModeChooser` shows three buttons for authenticated users: "I am a Worker" / "Soy Trabajador", "I am a Client" / "Soy Cliente", "Find a Professional"
- `LandingPage` shows a welcome page with `ModeChooser` for logged-in users, hero section for visitors
- `LandingPage` also fetches and displays a "Latest Professionals" grid below the hero for unauthenticated visitors (calls `GET /api/v1/workers/public/latest`)
- `WorkerCard` now has dual-action buttons: 💬 Chat + 👁 View Profile (with `stopPropagation` to prevent chat route). `WorkerCard.id` is typed as `string` (UUID). `slug?: string` is optional.
- AdminPage also has a link to Adminer (DB admin tool) at `/adminer`
- `useLanguage()` hook returns `{ lang, setLang, t }`. Spanish is the default language. All chat requests include `lang` in body so the backend instructs AI to respond in the matching language.
- nginx SPA fallback: `try_files $uri $uri/ /index.html`
- nginx serves security headers (CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, HSTS 1y), gzip, immutable `/assets/` cache (1y), and `no-cache` for `index.html` (audit P1-2). The Dockerfile `sed`-transforms `listen 80` → `listen 8080` so the container can run as the unprivileged `nginx` user (audit P2-1).
- `src/services/profiles.ts` was REMOVED in audit P3-2 — it was dead code. Profile read/reset happens via the chat handlers.
- `useDirectMessages` no longer exposes `tallyUnread` (removed in audit P3-2). Unread totals are recomputed inline by `addMessage` and `markRead`.
- `@types/react`, `@types/react-dom`, and `eslint-plugin-react-hooks` were REMOVED from `devDependencies` in audit P3-2. The project uses Preact; the vitest `react → preact/compat` alias already handles zustand's React dep.
- `ErrorBoundary` wraps all `<ProtectedRoute>` chains in `App.tsx` AND all five public routes (`/`, `/login`, `/terms`, `/privacy`, `/cookies`) per audit P1-5.
- `ErrorBoundary` "Try again" bumps an internal `resetKey` to remount children via a keyed wrapper (audit P2-3) — clearing bad state instead of resetting only the boundary flag.
- `AuthProvider` exposes an `error: boolean` on the context (audit P2-2) when the session-fetch promise rejects (auth service down vs. merely no session). Consumers can render a "service down / retry" UI; `refreshSession()` unconditionally clears the flag.
- `src/lib/validate.ts` provides anti-corruption validators (`assertString/Number/Bool/Array/Object/OptString`). `publicProfileApi.ts` and `src/store/directMessages.ts` use them at adapter boundaries to fail loudly on malformed backend payloads (audit P2-4).
- `sendChat(req, signal?)` accepts an optional `AbortSignal`; `useChat` aborts in-flight streams on unmount, mode change, and on a new send (audit P0-2). The stream loop buffers partial lines across chunks and breaks the outer `while` on `[DONE]` (audit P1-4).
- `DirectMessageSSE` (`src/lib/sse.ts`) guards every `JSON.parse` with `safeParse()` (audit P0-3), stops polling on SSE recovery (audit P0-1), and uses `AbortSignal.timeout` on poll fetches (audit P1-1).
- `src/services/api.ts` (and `directMessageApi.ts`, `publicProfileApi.ts`) default to a 15s `AbortSignal.timeout` when the caller does not supply its own signal (audit P1-1).
- `useDirectMessages` exposes `setActiveConv(convId)` / `setActiveConv(null)`. `addMessage` skips the `unread_count++` increment when the conversation is the active one (audit P1-3). `DirectMessagePage` calls `setActiveConv(convId)` on mount and `null` on unmount.
- Vitest coverage includes `src/lib/**`, `src/services/**` and `src/store/**`. Audit regression tests for SSE safeParse + recovery, chat AbortController passthrough, anti-corruption validators, and unread-active-guard live under `tests/{lib,services,store}/**`. `tests/placeholder.test.ts` remains as a vitest smoke test.