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
| `/admin` | `AdminPage.tsx` | Yes | Admin panel — edit system prompts + switch LLM provider |
| `/worker` | `WorkerPage.tsx` | Yes | Worker dashboard — read-only profile cards + intake chat |
| `/client` | `ClientPage.tsx` | Yes | Client dashboard — read-only profile cards + intake chat |

---

## Architecture

```
Browser ──► Traefik (:80)
              │
              ├── /api/v1/*      ──► Backend (:8081)
              │                       ├── /chat
              │                       ├── /worker/chat
              │                       ├── /worker/profile
              │                       ├── /client/chat
              │                       ├── /client/profile
              │                       ├── /system-prompts
              │                       ├── /user/reset-role
              │                       └── /conversations
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
| `src/ChatPage.tsx` | Chat UI — message list, input box, API integration with role detection |
| `src/AdminPage.tsx` | System prompt editor — edit `helper_prompt` + switch `llm_provider` via dropdown |
| `src/WorkerPage.tsx` | Worker dashboard — read-only profile cards + intake chat panel (two-column layout) |
| `src/ClientPage.tsx` | Client dashboard — read-only profile cards + intake chat panel |
| `src/LoginPage.tsx` | Magic-link login — email input, send link |
| `src/SignupPage.tsx` | Registration form — name, email, submit |
| `src/i18n.ts` | Internationalization — translations, language toggle |
| `nginx.conf` | Static file serving + SPA fallback (`try_files $uri /index.html`) |
| `Dockerfile` | Multi-stage: `node:20-alpine` build → `nginx:alpine` runtime |

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

## Worker Profile Intake Chat

The Worker Page (`/worker`) uses a two-column layout:

### Chat Panel (left column)

- Users type naturally: *"I'm a plumber in Madrid with 12 years experience"*
- The LLM (with the `worker_profile_prompt`) asks follow-up questions to gather all fields
- Every response includes a `[FIELDS]{json}[/FIELDS]` block with ALL known fields (cumulative)
- The frontend parses `detected_fields` from the API response and displays them in the profile cards
- Previous conversations are loaded on mount from `GET /api/v1/conversations?type=worker&limit=1`

### Profile Cards (right column)

Read-only profile display with 5 sections:

| Section | Fields |
|---------|--------|
| **Core** | Profession, Business Name, Bio, Phone |
| **Location** | City, Address, Service Radius |
| **Pricing** | Hourly Rate, Minimum Charge, Free Estimate |
| **Credentials** | Years Experience, Certifications, Has Insurance, Languages |
| **Online** | Website, Social Links |

- No manual forms — all data comes from the chat conversation
- "Reset Profile" button calls `DELETE /api/v1/worker/profile` to clear the profile
- "Reset Role" button calls `PUT /api/v1/user/reset-role` to clear the user role and redirect to chat

### Worker Profile Fields

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
| Instagram | `instagram` | string |
| Facebook | `facebook` | string |
| Twitter | `twitter` | string |
| LinkedIn | `linkedin` | string |
| TikTok | `tiktok` | string |
| YouTube | `youtube` | string |

---

## Client Profile Intake Chat

The Client Page (`/client`) uses the same two-column layout as the Worker Page:

### Chat Panel (left column)

- Users describe what they need: *"I need help fixing my bathroom"*
- The LLM (with the `client_profile_prompt`) asks follow-up questions to gather profile fields
- Every response includes a `[FIELDS]{json}[/FIELDS]` block with ALL known fields
- The frontend parses `detected_fields` from the API response and displays them in the profile cards
- Previous conversations are loaded on mount from `GET /api/v1/conversations?type=client&limit=1`

### Profile Cards (right column)

Read-only profile display with 3 sections:

| Section | Fields |
|---------|--------|
| **Personal** | Full Name, Phone |
| **Location** | City, Address |
| **About** | Bio, Preferred Contact, Property Type, Notes |

- No manual forms — all data comes from the chat conversation
- "Reset Profile" button calls `DELETE /api/v1/client/profile` to clear the profile

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

---

## Admin Page Features

### LLM Provider Selector

Dropdown at the top of the admin page:

| Option | Value | Behaviour |
|--------|-------|-----------|
| Default (auto) | `""` | Falls back to helper's auto fallback chain (Mistral → OpenCode → Ollama) |
| Mistral (cloud) | `"mistral"` | Forces Mistral API (requires `MISTRAL_API_KEY`) |
| OpenCode (external) | `"opencode"` | Forces OpenCode API regardless of env |
| Ollama (local) | `"ollama"` | Forces local Ollama regardless of env |

Changes take effect immediately — no container restart needed.

### Prompt Editor

Textareas to edit:
- `helper_prompt` — the system prompt sent to the LLM on every main chat request
- `worker_profile_prompt` — the system prompt for worker profile intake
- `client_profile_prompt` — the system prompt for client profile intake

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
| `[Worker]` | WorkerPage | Chat send/response, detected_fields, field merging |
| `[Client]` | ClientPage | Chat send/response, detected_fields, field merging |
| `[Admin]` | AdminPage | Prompt load/save, provider switch, timing |
| `[Nav]` | App router | Route changes, auth redirects |
| `[Auth]` | AuthProvider | Session check, login/logout, redirect |

Open browser DevTools (F12) → Console for debugging.

---

## Project Structure

```
frontend/
├── index.html                    # HTML shell
├── nginx.conf                    # nginx static file serving
├── Dockerfile                    # Multi-stage: node:20-alpine → nginx:alpine
├── package.json                  # Dependencies
├── vite.config.js                # Vite config
├── tsconfig.json                 # TypeScript config
├── src/
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Router + Auth + ProtectedRoute
│   ├── AuthProvider.tsx          # Session context + useAuth hook
│   ├── auth.ts                   # Login, signup, session API calls
│   ├── ChatPage.tsx              # Main chat interface
│   ├── AdminPage.tsx             # System prompt + LLM provider admin
│   ├── LoginPage.tsx             # Magic link login
│   ├── SignupPage.tsx            # Registration
│   ├── WorkerPage.tsx            # Worker dashboard — profile cards + intake chat
│   ├── ClientPage.tsx            # Client dashboard — profile cards + intake chat
│   ├── i18n.ts                   # Translations + language toggle
│   └── style.css                 # Shared design system
└── dist/                         # Production build output
```
