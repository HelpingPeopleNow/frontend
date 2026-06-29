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
        // Component files (covered by Playwright e2e, not unit tests)
        "src/**/*.tsx",
        // AuthProvider and chat/landing pages — require Preact runtime + DOM fixtures
        "src/AuthProvider.tsx",
        "src/hooks/**",
        // Wiring / barrel files — not user-facing logic
        "src/auth.ts",
        // Dead code per AGENTS.md — slated for removal in a separate PR
        "src/services/profiles.ts",
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