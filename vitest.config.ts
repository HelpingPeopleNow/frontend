import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  // Zustand v5 imports 'react' under the hood. Alias to preact/compat so the
  // store works in vitest without installing React.
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/jsx-runtime",
    },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: ["tests/setup.ts"],
    server: {
      deps: {
        // Pre-bundle zustand so its react import resolves through the alias.
        inline: ["zustand"],
      },
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/main.tsx",
        // Entry-point wiring / not user-facing logic
        "src/auth.ts",
        // Dead code per AGENTS.md — slated for removal in a separate PR
        "src/services/profiles.ts",
        // Components tested via Playwright e2e or requiring complex Preact context
        "src/AppShell.tsx",
        "src/App.tsx",
        "src/LandingNavBar.tsx",
        "src/LoginPage.tsx",
        "src/EntityListPage.tsx",
        "src/EntityDetailPage.tsx",
        "src/ChatPage.tsx",
        "src/FindPage.tsx",
        "src/components/**/*.tsx",
        // Pages dependent on EntityListPage/EntityDetailPage wrappers
        "src/WorkerDetailPage.tsx",
        "src/ClientDetailPage.tsx",
        "src/UserDetailPage.tsx",
        "src/UsersPage.tsx",
        "src/WorkersPage.tsx",
        "src/ClientsPage.tsx",
        "src/ConversationsPage.tsx",
        "src/ConversationDetailPage.tsx",
        "src/DirectConversationsPage.tsx",
        "src/DirectConversationDetailPage.tsx",
        // Hooks tested separately
        "src/hooks/**",
      ],
      thresholds: {
        lines: 75,
        branches: 75,
        functions: 78,
        statements: 75,
      },
    },
  },
});