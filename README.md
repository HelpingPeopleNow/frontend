# HelpingPeopleNow Frontend

Preact + Vite SPA served behind nginx. Dark-themed home-services platform where clients find workers and workers find jobs. Connects to the Go backend via API proxied through Traefik.

**URL:** `http://51.49.54.24` | **Container:** `nginx-hi-hermy`

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
| `/login` | `LoginPage.tsx` | No | Magic-link login form |
| `/signup` | `SignupPage.tsx` | No | Registration form |
| `/` | `ChatPage.tsx` | Yes | AI chat interface — the entry point for role detection |
| `/admin` | `AdminPage.tsx` | Yes | Admin panel — edit system prompt + switch LLM provider |
| `/worker` | `WorkerPage.tsx` | Yes | Worker dashboard (after role detected as "worker") |
| `/client` | `ClientPage.tsx` | Yes | Client dashboard (after role detected as "client") |
| `/prompts` | `PromptsPage.tsx` | Yes | Saved prompt snippets list (legacy, read-only) |

---

## Architecture

```
Browser ──► Traefik (:80)
              │
              ├── /api/v1/*      ──► Backend (:8081)
              │                       ├── /chat
              │                       ├── /system-prompts
              │                       └── /prompts
              │
              ├── /api/auth/*    ──► Auth Service (:8083)
              │
              └── /*             ──► Frontend nginx → SPA (index.html)
              └── /health        ──► Frontend nginx → 200 "ok"
```

The SPA uses client-side routing via `preact-router`. API calls use relative URLs (`/api/v1/...`) which Traefik proxies to the appropriate backend service.

### Health Check

The nginx config has a `/health` location block that returns `200 OK` with body `"ok"` and has `access_log off`. It is used for Docker container healthchecks.

| Endpoint | Response | Notes |
|----------|----------|-------|
| `GET /health` | `200 OK` with body `ok` | `access_log off`; no auth required |

### Auth Flow

1. User visits `/login` → enters email → auth service sends a magic link
2. Clicking the magic link creates a session cookie (`better-auth-session`)
3. `AuthProvider` checks the session on every route change
4. `ProtectedRoute` wrapper redirects to `/login` if no valid session
5. After role detection via chat, the frontend checks `session.user.role` and redirects to `/worker` or `/client`

---

## Key Files

| File | Purpose |
|------|---------|
| `src/main.tsx` | App entry point |
| `src/App.tsx` | Root component — router config + `AuthProvider` + `ProtectedRoute` wrapper |
| `src/AuthProvider.tsx` | Session context — loads user from `/api/auth/session`, exposes `useAuth()` hook |
| `src/auth.ts` | Auth helpers — signup, login (magic link request), session check |
| `src/api.ts` | API helper — generic fetch wrapper with error handling |
| `src/ChatPage.tsx` | Chat UI — message list, input box, API integration with role detection |
| `src/AdminPage.tsx` | System prompt editor — edit `helper_prompt` + switch `llm_provider` via dropdown |
| `src/WorkerPage.tsx` | Worker dashboard — manage services, availability, job listings |
| `src/ClientPage.tsx` | Client dashboard — search/find workers, request services |
| `src/LoginPage.tsx` | Magic-link login — email input, send link |
| `src/SignupPage.tsx` | Registration form — name, email, submit |
| `src/PromptsPage.tsx` | Read-only view of saved prompt snippets (legacy) |
| `nginx.conf` | Static file serving + SPA fallback (`try_files $uri /index.html`) |
| `Dockerfile` | Multi-stage: `node:22-alpine` build → `nginx:alpine` runtime |

---

## Role Detection Flow

```
1. User chats with the AI ("I am a plumber looking for work")
       │
2. ChatPage sends POST /api/v1/chat
       │
3. Backend returns { answer, detected_role: "worker" }
       │
4. ChatPage checks detected_role:
       ├─ If "worker" → disable input, show profile button
       └─ If "client" → disable input, show profile button
       │
5. Backend updates auth service (PUT .../role) → session.user.role = "worker"
       │
6. Frontend can redirect to /worker or /client using the session role
```

---

## Admin Page Features

### LLM Provider Selector

Dropdown at the top of the admin page:

| Option | Value | Behaviour |
|--------|-------|-----------|
| Default (env: USE_OLLAMA) | `""` | Falls back to helper's `USE_OLLAMA` env var |
| OpenCode (external) | `"opencode"` | Forces OpenCode API regardless of env |
| Ollama (local) | `"ollama"` | Forces local Ollama regardless of env |

Changes take effect immediately — no container restart needed.

### Prompt Editor

Textarea to edit the `helper_prompt` — the system prompt sent to the LLM on every chat request.

---

## Development

```bash
npm install          # Install dependencies
npm run dev          # Vite dev server with HMR
npm run build        # Production build → dist/
```

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
| `[Chat]` | ChatPage | Request timing, answer length, detected_role, errors |
| `[Admin]` | AdminPage | Prompt load/save, provider switch, timing |
| `[Nav]` | App router | Route changes, auth redirects |
| `[Auth]` | AuthProvider | Session check, login/logout, redirect |
| `[API]` | api.ts | Request/response summary for every API call |

Open browser DevTools (F12) → Console for debugging.

---

## Project Structure

```
frontend/
├── index.html                    # HTML shell
├── nginx.conf                    # nginx static file serving
├── Dockerfile                    # Multi-stage: node:22 → nginx:alpine
├── package.json                  # Dependencies
├── vite.config.js                # Vite config
├── tsconfig.json                 # TypeScript config
├── src/
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Router + Auth + ProtectedRoute
│   ├── AuthProvider.tsx          # Session context + useAuth hook
│   ├── auth.ts                   # Login, signup, session API calls
│   ├── api.ts                    # Generic fetch wrapper
│   ├── ChatPage.tsx              # Main chat interface
│   ├── AdminPage.tsx             # System prompt + LLM provider admin
│   ├── LoginPage.tsx             # Magic link login
│   ├── SignupPage.tsx            # Registration
│   ├── WorkerPage.tsx            # Worker dashboard
│   ├── ClientPage.tsx            # Client dashboard
│   ├── PromptsPage.tsx           # Saved prompts (legacy)
│   └── types.ts                 # Shared TypeScript types
└── dist/                         # Production build output
```
