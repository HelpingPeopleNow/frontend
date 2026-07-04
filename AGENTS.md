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

## Conventions

- Preact with `preact-router` v4 client-side routing
- `AuthProvider` context wraps app → exposes `useAuth()`: `session`, `loading`, `sendMagicLink`, `logout`, `refreshSession`
- API calls use relative URLs (`/api/v1/...`, `/api/auth/...`) — proxied by Traefik; no Vite proxy config needed
- Console logging with component prefixes: `[Chat]`, `[Admin]`, `[Auth]`, `[Nav]`, `[ModeChooser]`
- Public profile API client: `src/lib/publicProfileApi.ts` — `fetchPublicProfile(slug)` + `fetchLatestProfiles(limit)`, types `WorkerPublicProfile` and `SocialLink`
- CSS-in-JS via `<style>` tags in each component; `src/style.css` is the shared design system
- Worker profile stores arrays as JSON fields (certifications, languages, social_links)
- `index.html` imports `/src/main.tsx`
- Session cookie name: `better-auth.session_token` (set by Better Auth over HTTP in dev). In production (HTTPS), Better Auth sets the `__Secure-better-auth.session_token` variant. Backend's `AuthMiddleware` accepts both forms.

## Auth flow

- `/api/auth/get-session` — session check on mount & route change (Better Auth default endpoint)
- `/api/auth/sign-in/magic-link` — POST with `{ email, callbackURL: '/', metadata: { lang } }`
- `/api/auth/sign-out` — POST (best-effort, credentials: include)
- `ProtectedRoute` redirects to `/login` if no session; shows "Checking authentication..." while loading

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

Multi-stage: `node:22-alpine` build → `nginx:alpine` runtime (container name `helpingpeoplenow-frontend` in compose). CI pipeline (`.github/workflows/ci.yml`): lint → typecheck → vitest (unit + integration) → Playwright e2e → docker build/push to ghcr.

## Direct Messaging

- **Flow**: FindPage → click WorkerCard → `/workers/:workerId` → `WorkerContactPage` calls `GET /api/v1/workers/:id/contact` → redirects to `/inbox/:convId` → `DirectMessagePage`
- **API client**: `src/lib/directMessageApi.ts` — wraps all DM endpoints with `fetchJSON` (credentials: include)
- **SSE**: `src/lib/sse.ts` — `DirectMessageSSE` class: opens EventSource on `/api/v1/direct-messages/stream`, falls back to polling (`/since`) after 3+ consecutive failures, exponential backoff reconnect
- **Store**: `src/store/directMessages.ts` — Zustand store. `connect()` starts SSE listener, `addMessage()` appends inbound messages to the correct thread and increments unread
- **Status indicator**: InboxPage shows a colored dot: green (open), yellow (connecting), cyan (polling), red (disconnected)
- **Rate limiting**: `sendMessage()` in store catches 429 responses, sets `rateLimited: true` with 5s auto-clear. DirectMessagePage shows ⏳ banner.
- **Block/Report**: DirectMessagePage has ⋯ action menu with Archive, Block, Report. Block shows confirmation dialog in red, report in warning. Archive navigates to /inbox.
- **WorkerCard**: Made clickable in Phase 2 — `onClick` calls `route('/workers/:id', false)` (pushState for back button support)

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
- `src/services/profiles.ts` is dead code — no component imports its functions. Profile read/reset happens via the chat handlers. Slated for removal.
- `useDirectMessages` exposes a `tallyUnread(convId)` action that is never called by any component. Slated for removal.
- `@types/react` and `@types/react-dom` are in `devDependencies` but the project uses Preact, not React. Slated for removal.
- `ErrorBoundary` wraps all `<ProtectedRoute>` chains in `App.tsx` — no functional tests cover the error path today.
- `tests/placeholder.test.ts` is the only vitest test (single `expect(1 + 1).toBe(2)`); the integration paths the README hints at (chat, conversations, etc.) are not yet implemented.