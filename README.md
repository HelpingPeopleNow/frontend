# Helping People Now — Frontend

Frontend web application for **Helping People Now**, a dark-themed single-page app built with **Preact** and **Vite**, served by **nginx** in production via a multi-stage Docker build. Includes a full CRUD interface for managing **Prompt Helpers** via the backend API.

## Tech Stack

| Layer      | Technology                                                                 |
|------------|----------------------------------------------------------------------------|
| UI         | [Preact](https://preactjs.com/) — a fast 3kB alternative to React |
| Build      | [Vite](https://vitejs.dev/) + [@preact/preset-vite](https://github.com/preactjs/preset-vite) |
| Runtime    | [nginx:alpine](https://nginx.org/) — lightweight production HTTP server |
| CI/CD      | GitHub Actions → GitHub Container Registry (ghcr.io) |

## Project Structure

```
.
├── src/
│   ├── main.jsx         # Entry point — renders <App />
│   ├── App.jsx          # Root component with Home ↔ PromptsPage navigation
│   ├── PromptsPage.jsx  # CRUD page: list, create, edit, delete prompt helpers
│   ├── api.js           # Fetch wrappers for backend /api/v1/prompt-helpers
│   └── style.css        # CSS reset
├── nginx.conf           # Production nginx — static files + /api/ proxy
├── index.html           # HTML shell
├── vite.config.js       # Vite + Preact preset
├── Dockerfile           # Multi-stage: node:20-alpine build → nginx:alpine runtime
├── package.json
├── .github/
│   └── workflows/
│       └── docker.yml   # CI/CD: build & push to ghcr.io on push/PR to main
└── README.md
```

## Pages

### Home

The landing page features the **"hi hermy, p"** branding with two buttons:

| Button | Action |
|--------|--------|
| **Say Hello** | Calls `GET /api/v1/hello` and displays a random greeting phrase |
| **Prompt Helpers** | Navigates to the CRUD management page |

### Prompt Helpers

Full CRUD interface for `PromptHelper` entities stored in PostgreSQL:

| Action | API Call |
|--------|----------|
| **List** all | `GET /api/v1/prompt-helpers` |
| **Create** a new prompt | `POST /api/v1/prompt-helpers` |
| **Edit** an existing prompt | `PATCH /api/v1/prompt-helpers/:id` |
| **Delete** a prompt | `DELETE /api/v1/prompt-helpers/:id` |

The form supports both creation and editing (pre-filled). Each entry shows a preview and timestamps.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18 (LTS recommended)
- npm (ships with Node.js)

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The app is available at **http://localhost:5173** with HMR.

### Production Build

```bash
npm run build
```

Output goes to `dist/`.

### Preview Production Build

```bash
npm run preview
```

## Docker

### Build the Image

```bash
docker build -t helpingpeoplenow-frontend .
```

Multi-stage build: `node:20-alpine` (builder) → `nginx:alpine` (runtime).

### Run the Container

```bash
docker run -p 8080:80 --add-host backend:host-gateway helpingpeoplenow-frontend
```

## API Proxy

The nginx config proxies `/api/` requests to the backend (Docker networking):

```nginx
location /api/ {
    proxy_pass http://backend:8081;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## CI/CD

Pushes and PRs to `main` trigger **GitHub Actions** (`docker.yml`):

1. Checks out the repo
2. Logs in to **GitHub Container Registry** (`ghcr.io`)
3. Sets up Docker Buildx
4. Builds and pushes the image

Image tags: `latest`, branch name, commit SHA.

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Bundle for production |
| `npm run preview` | Serve production build locally |

## Dependencies

- **preact** — Lightweight React alternative
- **@preact/preset-vite** — Vite integration for Preact JSX
- **vite** — Build tool and dev server

Zero other runtime dependencies.
