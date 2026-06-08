# HelpingPeopleNow Frontend

Preact + Vite SPA served behind nginx. Dark-themed chat interface with system prompt administration.

**URL:** http://51.49.54.24:8080

## Stack

| Layer | Technology |
|-------|-----------|
| **UI** | Preact (React-compatible, 3kB) |
| **Routing** | preact-router v4 |
| **Build** | Vite + TypeScript |
| **Runtime** | nginx:alpine (multi-stage Docker) |
| **CI/CD** | GitHub Actions → ghcr.io |

## Pages / Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `ChatPage.tsx` | Chat interface — send messages to the AI assistant |
| `/admin` | `AdminPage.tsx` | System prompts editor — edit helper prompts |

## Architecture

```
Browser → nginx (:80)
            ├── /api/*      → proxy_pass to backend (:8081)
            └── /*          → serve SPA (index.html for all routes)
```

The SPA uses preact-router for client-side routing. API calls use relative URLs (`/api/v1/...`) which nginx proxies to the Go backend.

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root component — navbar (Home / Admin) + Router config |
| `src/ChatPage.tsx` | Chat UI — message list, input, API integration |
| `src/AdminPage.tsx` | System prompt editor — load/save helper prompt |
| `Dockerfile` | Multi-stage: node:20-alpine build → nginx:alpine runtime |
| `nginx-default.conf` | Static file serving + `/api/` proxy to backend |

## Logging

All API calls and route changes are logged to the browser console with `[Chat]`, `[Admin]`, and `[Nav]` prefixes, including:
- Request/response timing (ms)
- Payload sizes (chars)
- Error details on failure

Open the browser DevTools console (F12) for debugging.

## Development

```bash
npm install
npm run dev     # Vite dev server with HMR
npm run build   # Production build → dist/
```

## Environment

No runtime env vars — the SPA is fully static. API backend URL is configured via nginx proxy_pass.

## Docker Build

```bash
docker build -t ghcr.io/helpingpeoplenow/frontend:latest .
docker push ghcr.io/helpingpeoplenow/frontend:latest
```

CI builds and pushes automatically on push to `main`.
