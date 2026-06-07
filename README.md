# Helping People Now — Frontend

Frontend web application for **Helping People Now**, a dark-themed single-page app built with **Preact** and **Vite**, served by **nginx** in production via a multi-stage Docker build.

## Tech Stack

| Layer   | Technology                                                                 |
|---------|----------------------------------------------------------------------------|
| **UI**  | [Preact](https://preactjs.com/) — a fast 3kB alternative to React with the same modern API |
| **Build** | [Vite](https://vitejs.dev/) + [@preact/preset-vite](https://github.com/preactjs/preset-vite) — instant HMR dev server and optimized production bundling |
| **Runtime** | [nginx:alpine](https://nginx.org/) — lightweight production HTTP server |
| **CI/CD** | GitHub Actions → GitHub Container Registry (ghcr.io) |

## Project Structure

```
frontend/
├── .github/
│   └── workflows/
│       └── docker.yml          # CI/CD: build & push Docker image to GHCR
├── src/
│   ├── App.jsx                 # Main Preact component (dark theme, hello button)
│   ├── main.jsx                # App entry point — renders App into #app
│   └── style.css               # CSS reset
├── index.html                  # HTML shell with <div id="app">
├── nginx.conf                  # Nginx config — serve static files, proxy /api/
├── Dockerfile                  # Multi-stage build: node:20-alpine → nginx:alpine
├── vite.config.js              # Vite config with Preact preset
├── package.json                # Dependencies and scripts
├── package-lock.json           # Locked dependency tree
└── .gitignore                  # Ignored: node_modules, dist, .vite
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18 (LTS recommended)
- npm (ships with Node.js) or [pnpm](https://pnpm.io/)

### Install Dependencies

```bash
npm install
```

### Run Development Server

Starts Vite's dev server with hot module replacement (HMR):

```bash
npm run dev
```

By default, the app is available at **http://localhost:5173**. The `/api/` proxy path in dev mode does not proxy by default — see [API Proxy](#api-proxy) for running the full stack locally.

### Production Build

```bash
npm run build
```

Produces an optimized static bundle in `dist/`.

### Preview Production Build

```bash
npm run preview
```

Serves the `dist/` folder locally via Vite's preview server at **http://localhost:4173**.

## Docker

### Build the Image

```bash
docker build -t helpingpeoplenow-frontend .
```

This runs a two-stage build:

1. **Builder stage** — `node:20-alpine`, installs deps with `npm ci`, runs `vite build` → outputs `dist/`.
2. **Runtime stage** — `nginx:alpine`, copies `dist/` to `/usr/share/nginx/html` and `nginx.conf` to `/etc/nginx/conf.d/default.conf`.

### Run the Container

```bash
docker run -p 8080:80 helpingpeoplenow-frontend
```

The app is served at **http://localhost:8080**.

To connect the frontend to a backend API running on the host, use `--add-host`:

```bash
docker run -p 8080:80 --add-host backend:host-gateway helpingpeoplenow-frontend
```

## API Proxy

The nginx config (`nginx.conf`) proxies any request under `/api/` to `http://backend:8081`. This keeps frontend and backend on the same origin in production.

```nginx
location /api/ {
    proxy_pass http://backend:8081/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

For local development with the full stack:

- Start your backend at `localhost:8081`
- Either run nginx locally, or use a dev proxy (e.g., Vite's `server.proxy` option)

The current `App.jsx` calls `GET /api/v1/hello` and displays the JSON response in an alert.

## CI/CD

Pushes and pull requests to the `main` branch trigger **GitHub Actions** (`docker.yml`):

1. Checks out the repository
2. Logs in to **GitHub Container Registry** (`ghcr.io`)
3. Extracts Docker metadata (SHA-based tag, branch tag, `latest` on default branch)
4. Sets up Docker Buildx
5. Builds and pushes the image (push only on non-PR events)

The resulting image is available at:

```
ghcr.io/helpingpeoplenow/frontend:latest
ghcr.io/helpingpeoplenow/frontend:<sha>    (e.g., ghcr.io/helpingpeoplenow/frontend:abc1234)
```

Build caching is configured via GitHub Actions cache (`type=gha`) for faster subsequent runs.

## Scripts Reference

| Command            | Description                             |
| ------------------ | --------------------------------------- |
| `npm run dev`      | Start Vite dev server with HMR          |
| `npm run build`    | Bundle for production                   |
| `npm run preview`  | Serve production build locally          |

## License

Internal project — all rights reserved.
