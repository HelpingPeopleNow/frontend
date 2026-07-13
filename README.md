# Helping People Frontend

Preact + Vite SPA served behind nginx. Dark-themed home-services platform where clients find workers and workers find jobs. Connects to the Go backend via API proxied through Traefik.

**URL:** `https://helpingpeople.cloud` | **Container:** `helpingpeoplenow-frontend`

---

## Stack

| Layer | Technology |
|-------|-----------|
| **UI** | Preact (React-compatible, 3kB) |
| **Routing** | `preact-router` v4 |
| **Build** | Vite + TypeScript |
| **Runtime** | nginx:alpine (multi-stage Docker) |
| **CI/CD** | GitHub Actions → ghcr.io |

---

## Pages & Routes

| Route | Component | Auth Required | Description |
|-------|-----------|:---:|-------------|
| `/` | `LandingPage.tsx` | No | Landing page — redirects to `/chat` if logged in |
| `/login` | `LoginPage.tsx` | No | Magic-link login + signup form |
| `/terms` | `TermsPage.tsx` | No | Terms and conditions (bilingual EN/ES) |
| `/privacy` | `PrivacyPage.tsx` | No | Privacy policy (bilingual EN/ES) |
| `/cookies` | `CookiesPage.tsx` | No | Cookie policy (bilingual EN/ES) |
| `/profile/:slug` | `PublicProfilePage.tsx` | No | Public worker profile with hero, stats, bio, links, CTA |
| `/chat` | `ChatPage.tsx` | Yes | AI chat — modes via `?mode=` param: `worker_intake`, `client_intake`, `search` |
| `/find` | `FindPage.tsx` | Yes | Find professionals — worker card grid |
| `/inbox` | `InboxPage.tsx` | Yes | DM inbox with status indicators |
| `/inbox/:convId` | `DirectMessagePage.tsx` | Yes | DM thread with send, block, report, archive |
| `/workers/:workerId` | `WorkerContactPage.tsx` | Yes | Create/resume DM with a worker, redirects to inbox |
| `/admin` | `AdminPage.tsx` | Yes | Admin menu — links to LLM provider, prompts, and entity CRUD pages |
| `/admin/feedback` | `FeedbackAdminPage.tsx` | Yes | Admin feedback dashboard — triage user-submitted feedback |

---

## Architecture

```
Browser ──► Traefik (:80)
              │
              ├── /api/v1/*           ──► Backend (:8081)
              │                          (unified POST /api/v1/chat with mode + optional GPS coordinates in body,
              │                           GET/DELETE /api/v1/{worker,client}/profile,
              │                           GET/PUT /api/v1/system-prompts/,
              │                           GET /api/v1/conversations,
              │                           GET/POST/PATCH /api/v1/direct-messages/,
              │                           GET /api/v1/workers/:id/contact,
              │                           GET/PUT/DELETE /api/v1/admin/{entity}/)
              │
              ├── /api/auth/*         ──► Auth Service (:8083) — magic-link + sessions
              │
              ├── adminer.helpingpeople.cloud, grafana.helpingpeople.cloud, prometheus.helpingpeople.cloud — observability / DB UI
              │
              └── /*                  ──► Frontend nginx → SPA (index.html)
                 /health              ──► Frontend nginx → 200 "ok"
```

The SPA uses client-side routing via `preact-router`. Public routes (`/`, `/login`, `/terms`, `/privacy`, `/cookies`, `/profile/:slug`) require no auth. All other routes are wrapped in `ProtectedRoute` which redirects to `/login` if no valid session.

API calls use relative URLs (`/api/v1/...`, `/api/auth/...`) which Traefik proxies to the appropriate backend service.

### Health Check

The nginx config has a `/health` location block that returns `200 OK` with body `"ok"` and has `access_log off`. It is used for Docker container healthchecks.

| Endpoint | Response | Notes |
|----------|----------|-------|
| `GET /health` | `200 OK` with body `ok` | `access_log off`; no auth required |

### Auth Flow

1. User visits `/login` → enters email (or name + email for new accounts) → auth service sends a magic link
2. Clicking the magic link creates a session cookie (`better-auth.session_token`)
3. `AuthProvider` checks the session on every route change
4. `ProtectedRoute` wrapper redirects to `/login` if no valid session
5. After login, user lands on LandingPage → `ModeChooser` (or navigates to `/chat?mode=...`)

### Cap CAPTCHA

- **Provider**: [Cap](https://cap.helpingpeople.cloud) — open-source CAPTCHA service
- **Widget**: `<cap-widget>` custom element embedded on `LoginPage` and `PublicProfilePage` (for the contact-CTA `getContact` flow)
- **Token delivery**: `capToken` is obtained from the widget and sent:
  - In `metadata.capToken` when calling `sendMagicLink` (magic-link login/signup)
  - As a `?capToken=` query parameter when calling `GET /api/v1/workers/:id/contact` (public profile CTA)
- **CSP requirements**: The Content-Security-Policy in `nginx.conf` must allow:
  - `script-src` / `worker-src`: `cap.helpingpeople.cloud` and `wasm-unsafe-eval`
  - `connect-src`: `cap.helpingpeople.cloud`

### Internationalization (i18n)

- Spanish is the default language (configurable via `LangToggle` in sidebar)
- Single `i18n.ts` file with translations, language context, `useLanguage()` hook, and toggle
- All UI text uses `t()` from `useLanguage()` for translated strings
- Chat requests include a `lang` parameter so the AI responds in the matching language

### Analytics

- A self-hosted **Umami** analytics script is injected in `index.html` (`https://helpingpeople.cloud/umami/script.js`). It tracks page views without cookies and does not collect personal data. The `CookiesPage` states that the platform does not use third-party, advertising, social-media, or analytics/tracking cookies.

### GPS Geolocation

- `useGeolocation()` hook wraps `navigator.geolocation` with 5-min cache (`maximumAge: 300000`)
- Chat and Find pages pass `latitude`/`longitude` in the `POST /api/v1/chat` body when available
- Backend computes distance; `WorkerCard` renders `· 📍 X.X km` inline (values <1 km show as `<1 km`)
- When location permission is denied, a blue banner (`.location-banner`) shows with `t('chat.location.denied')` guiding users to enable it in browser settings

**GPS source precedence (highest → lowest):**
1. Request `latitude`/`longitude` from browser geolocation (most current)
2. Stored `client_profiles.latitude`/`longitude` from intake
3. Absent → no distance sorting, no proximity filter

**City source precedence (highest → lowest):**
1. City extracted from the user's message by the Pass-1 LLM
2. Stored `client_profiles.city` from intake
3. Absent → no city filter

---

## Key Files

| File | Purpose |
|------|---------|
| `src/main.tsx` | App entry point |
| `src/App.tsx` | Root component — router config + `AuthProvider` + `ProtectedRoute` wrapper |
| `src/AuthProvider.tsx` | Session context — loads user from `/api/auth/get-session`, exposes `useAuth()` hook |
| `src/auth.ts` | Barrel re-export of services/auth — getSession, sendMagicLink, logout |
| `src/ChatPage.tsx` | Chat UI — message list, input, mode-based routing (worker_intake/client_intake), SSE streaming |
| `src/AdminPage.tsx` | Admin menu — links to `/admin/llm`, `/admin/prompts`, and entity CRUD pages |
| `src/AdminLLMPage.tsx` | LLM provider dropdown — calls `PUT /api/v1/system-prompts/provider` |
| `src/AdminPromptsPage.tsx` | 4-prompt textarea editor — calls `PUT /api/v1/system-prompts/{column}` |
| `src/FeedbackAdminPage.tsx` | Admin feedback dashboard — lists/subcategories feedback with status filters |
| `src/LoginPage.tsx` | Magic-link login + signup — email input, send link (embeds Cap CAPTCHA widget) |
| `src/PublicProfilePage.tsx` | Public worker profile with hero, stats, bio, links, CTA (embeds Cap CAPTCHA for contact) |
| `src/TermsPage.tsx` | Bilingual EN/ES terms and conditions |
| `src/PrivacyPage.tsx` | Bilingual EN/ES privacy policy |
| `src/CookiesPage.tsx` | Bilingual EN/ES cookie policy |
| `src/i18n.ts` | Internationalization — translations, language toggle |
| `src/lib/logger.ts` | Centralized logger — `createLogger(prefix)` for scoped console output |
| `src/lib/feedbackApi.ts` | Feedback API client — `submitFeedback()`, `listFeedback()`, `updateFeedbackStatus()` |
| `src/lib/publicProfileApi.ts` | Public profile API — `fetchPublicProfile(slug)`, `fetchLatestProfiles(limit)` |
| `src/lib/validate.ts` | Anti-corruption validators — `assertString`, `assertNumber`, `assertArray`, etc. |
| `src/components/feedback/FeedbackWidget.tsx` | Feedback FAB button (💬) — fixed-position, opens FeedbackPopover |
| `src/components/feedback/FeedbackPopover.tsx` | Feedback form — category buttons, textarea, submit with success toast |
| `src/components/CookieConsent.tsx` | Cookie consent banner — shown on first visit |
| `src/hooks/useGeolocation.ts` | GPS geolocation — wraps `navigator.geolocation`, returns `{ latitude, longitude, loading, permissionDenied, error }` |
| `nginx.conf` | Static file serving + SPA fallback (`try_files $uri /index.html`) + security headers (CSP/HSTS/X-Frame-Options/etc.), gzip, asset caching (audit P1-2) |
| `Dockerfile` | Multi-stage: `node:22-alpine` build → `nginx:alpine` runtime. Runs as non-root `nginx` user on port 8080 with `HEALTHCHECK` (audit P2-1) |

---

## Worker Profile Intake Chat

The Worker intake mode is reached via `/chat?mode=worker_intake`. The chat is the only UI — no separate `/worker` page exists.

### Chat Panel

- Users type naturally: *"I'm a plumber in Madrid with 12 years experience"*
- The LLM (with the `worker_profile_prompt`) asks follow-up questions to gather all 22 fields
- The LLM emits a `[FIELDS]{json}[/FIELDS]` block; the backend parses it and merges into the worker profile via map-based upsert
- Previous conversations are loaded on mount from `GET /api/v1/conversations?type=worker&limit=1`

### Profile Field Coverage

| Field | JSON key | Type |
|-------|----------|------|
| Profession | `profession` | string |
| Business Name | `business_name` | string |
| Bio | `bio` | string |
| Phone | `phone` | string |
| City | `city` | string |
| Address | `address` | string |
| Service Radius | `service_radius_km` | number |
| Hourly Rate | `hourly_rate` | number |
| Minimum Charge | `minimum_charge` | number |
| Free Estimate | `free_estimate` | boolean |
| Years Exp | `years_experience` | number |
| Certifications | `certifications` | string[] |
| Has Insurance | `has_insurance` | boolean |
| Languages | `languages` | string[] |
| Emergency | `emergency_service` | boolean |
| Website | `website` | string |
| Social Links | `social_links` | `{platform,url}[]` |

- "Reset Profile" calls `DELETE /api/v1/worker/profile` (no `PUT` endpoint — chat handlers do the saving)
- Chat request body includes `mode: "worker_intake"` and `lang`

---

## Client Profile Intake Chat

The Client intake mode is reached via `/chat?mode=client_intake`. The chat is the only UI — no separate `/client` page exists.

### Chat Panel

- Users describe what they need: *"I need help fixing my bathroom"*
- The LLM (with the `client_profile_prompt`) asks follow-up questions to gather profile fields
- The LLM emits a `[FIELDS]{json}[/FIELDS]` block; the backend parses it and merges into the client profile
- Previous conversations are loaded on mount from `GET /api/v1/conversations?type=client&limit=1`

### Client Profile Fields

| Field | JSON key | Type |
|-------|----------|------|
| Full Name | `full_name` | string |
| Phone | `phone` | string |
| City | `city` | string |
| Address | `address` | string |
| Bio | `bio` | string |
| Preferred Contact | `preferred_contact` | string |
| Property Type | `property_type` | string |
| Notes | `notes` | string |

- "Reset Profile" calls `DELETE /api/v1/client/profile`
- Chat request body includes `mode: "client_intake"` and `lang`

---

## Admin Page Features

### LLM Provider Selector

Dropdown at the top of the admin page:

| Option | Value | Behaviour |
|--------|-------|-----------|
| Default (auto) | `""` | Falls back to helper's auto fallback chain (OpenCode 0 → OpenCode 1 → OpenCode 2 → Mistral → Ollama, cheap-first R5) |
| OpenCode 0 (Big Pickle) | `"opencode0"` | Forces big-pickle model |
| OpenCode 1 | `"opencode1"` | Forces first OpenCode endpoint (`deepseek-v4-flash-free`) |
| OpenCode 2 | `"opencode2"` | Forces second OpenCode endpoint (`mimo-v2.5-free`) |
| Ollama (local) | `"ollama"` | Forces local Ollama |
| Mistral (cloud) | `"mistral"` | Forces Mistral API (requires `MISTRAL_API_KEY`) |

Changes take effect immediately — no container restart needed.

### Prompt Editor

Textareas to edit (one per column in the `system_prompts` table):

| Column | i18n key | Purpose |
|--------|----------|---------|
| `worker_profile_prompt` | `admin.prompt.worker` | System prompt for worker profile intake chat |
| `client_profile_prompt` | `admin.prompt.client` | System prompt for client profile intake chat |
| `find_trader_search_prompt` | `admin.prompt.find_trader_search` | First-pass search-params extraction |
| `find_trader_presentation_prompt` | `admin.prompt.find_trader_presentation` | Second-pass results-presentation |

Each textarea has a per-column Save button that calls `PUT /api/v1/system-prompts/{column}`.

---

## Development

```bash
npm install          # Install dependencies
npm run dev          # Vite dev server with HMR on :5173
npm run build        # Production build → dist/
npm run preview      # vite preview (serves built dist/)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint src/
```

### Tests

```bash
npm run test:coverage       # vitest run --coverage (unit + integration)
npm run test:e2e            # playwright test (uses built dist/)
```

Coverage thresholds (enforced in `vitest.config.ts`): lines 75%, branches 75%, functions 78%, statements 75%. The CI pipeline (`.github/workflows/ci.yml`) runs: lint → typecheck → vitest (unit + integration) → Playwright e2e → Docker build/push to `ghcr.io/helpingpeoplenow/frontend`.

> Note: the `package.json` only exposes `test:coverage` and `test:e2e` — there is no plain `npm test` (vitest watch) script. Use `npx vitest` for watch mode locally.

### Docker Build

```bash
docker build -t ghcr.io/helpingpeoplenow/frontend:latest .
docker push ghcr.io/helpingpeoplenow/frontend:latest
```

CI builds and pushes automatically on push to `main`.

---

## Logging

Browser console logging with component prefixes:

| Prefix | Component | Events |
|--------|-----------|--------|
| `[Chat]` | ChatPage | Request timing, answer length, mode, errors |
| `[Auth]` | AuthProvider | Session check, login/logout, redirect |
| `[Admin]` | AdminLLMPage / AdminPromptsPage | Prompt load/save, provider switch, timing |
| `[DM]` | DirectMessagePage / WorkerContactPage | DM send, block, report, archive |
| `[Nav]` | App router | Route changes, auth redirects |
| `[ModeChooser]` | ModeChooser | Card click navigation |
| `[API]` | services/api.ts | Generic fetch calls, error handling |
| `[SSE]` | DirectMessageSSE | Connect, disconnect, reconnect attempts, polling fallback |
| `[Inbox]` | InboxPage | Thread list load, unread badge |
| `[Thread]` | DirectMessagePage | Message load, scroll, read receipt |
| `[Speech]` | useSpeechRecognition | Voice input start/stop/error |
| `[App]` | App.tsx | Mount, route init |
| `[Profile]` | PublicProfilePage | Profile load, CTA click |
| `[Landing]` | LandingPage | Hero load, latest professionals |
| `[Feedback]` | FeedbackWidget / FeedbackPopover | Submit, success, error |
| `[Geo]` | useGeolocation | GPS permission, coords, error |

Open browser DevTools (F12) → Console for debugging.

---

## Project Structure

```
frontend/
├── index.html                    # HTML shell (imports /src/main.tsx)
├── nginx.conf                    # nginx static file serving + SPA fallback + /health
├── Dockerfile                    # Multi-stage: node:22-alpine → nginx:alpine
├── package.json                  # Dependencies
├── vite.config.js                # Vite config (Preact preset)
├── tsconfig.json                 # TypeScript config
├── playwright.config.js          # Playwright e2e config
├── e2e/
│   └── deploy.spec.js            # Playwright deploy-smoke tests
├── src/
│   ├── main.tsx                  # Entry point — renders App with LanguageProvider
│   ├── App.tsx                   # Router + AuthProvider + ProtectedRoute + ErrorBoundary
│   ├── AppShell.tsx              # Sidebar + header layout
│   ├── AuthProvider.tsx          # Session context + useAuth hook
│   ├── auth.ts                   # Barrel re-export of services/auth
│   ├── i18n.ts                   # EN/ES translations + LanguageProvider + LangToggle
│   ├── style.css                 # Shared design system
│   ├── LoginPage.tsx             # Magic link login + signup (embeds Cap CAPTCHA widget)
│   ├── LandingPage.tsx           # Marketing landing for visitors / ModeChooser for authed
│   ├── ChatPage.tsx              # Worker/client intake chat (mode in query string)
│   ├── FindPage.tsx              # Search/find professional chat
│   ├── PublicProfilePage.tsx     # Public worker profile with hero, stats, bio, links, CTA
│   ├── ModeChooser.tsx           # 3-card mode selector
│   ├── AdminPage.tsx             # Admin menu
│   ├── AdminLLMPage.tsx          # LLM provider dropdown
│   ├── AdminPromptsPage.tsx      # 4-prompt textarea editor
│   ├── FeedbackAdminPage.tsx     # Admin feedback dashboard — status filters, category, message
│   ├── TermsPage.tsx             # Bilingual EN/ES terms and conditions
│   ├── PrivacyPage.tsx           # Bilingual EN/ES privacy policy
│   ├── CookiesPage.tsx           # Bilingual EN/ES cookie policy
│   ├── UsersPage / UserDetailPage.tsx
│   ├── WorkersPage / WorkerDetailPage.tsx
│   ├── ClientsPage / ClientDetailPage.tsx
│   ├── ConversationsPage / ConversationDetailPage.tsx
│   ├── MessagesPage / MessageDetailPage.tsx
│   ├── EntityListPage.tsx        # Generic admin CRUD list
│   ├── EntityDetailPage.tsx      # Generic admin CRUD detail
│   ├── components/
│   │   ├── ErrorBoundary.tsx     # Catches render errors
│   │   ├── CookieConsent.tsx     # Cookie consent banner — shown on first visit
│   │   ├── feedback/
│   │   │   ├── FeedbackWidget.tsx   # Fixed-position FAB (💬) — opens FeedbackPopover
│   │   │   └── FeedbackPopover.tsx  # Feedback form — category, textarea, submit
│   │   └── chat/
│   │       ├── ChatInput.tsx     # Input bar with optional mic button
│   │       ├── ChatMessages.tsx  # Bubble list with worker card grid
│   │       ├── ChatWelcome.tsx   # First-message welcome card
│   │       └── WorkerCard.tsx    # Clickable worker summary card (shows distance_km when available)
│   ├── hooks/
│   │   ├── useChat.ts            # Chat state + SSE streaming
│   │   ├── useChatInit.ts        # Load most recent conversation
│   │   ├── useGeolocation.ts     # GPS geolocation (latitude, longitude, permissionDenied)
│   │   └── useSpeechRecognition.ts  # Voice input via Web Speech API
│   ├── lib/
│   │   ├── logger.ts              # Centralized logger — createLogger(prefix)
│   │   ├── feedbackApi.ts         # Feedback API — submitFeedback, listFeedback, updateFeedbackStatus
│   │   ├── publicProfileApi.ts    # Public profile API — fetchPublicProfile, fetchLatestProfiles
│   │   ├── validate.ts            # Anti-corruption validators — assertString, assertArray, etc.
│   │   ├── directMessageApi.ts   # DM API client (contact, inbox, messages, etc.)
│   │   └── sse.ts                # DirectMessageSSE class with reconnect + polling fallback
│   ├── pages/
│   │   ├── InboxPage.tsx         # DM inbox
│   │   ├── DirectMessagePage.tsx # DM thread + actions
│   │   └── WorkerContactPage.tsx # Intermediate redirect after clicking WorkerCard
│   ├── services/
│   │   ├── api.ts                # request() — generic fetch with credentials
│   │   ├── auth.ts               # getSession, sendMagicLink, logout
│   │   ├── chat.ts               # sendChat (raw fetch, SSE-aware)
│   │   ├── conversations.ts      # list/get conversations
│   │   ├── systemPrompts.ts      # GET/PUT system prompts
│   │   ├── admin.ts              # list/get/update/delete admin entities
│   │   └── profiles.ts           # (dead — see GOTCHA)
│   └── store/
│       └── directMessages.ts     # Zustand store
└── dist/                         # Production build output
```
