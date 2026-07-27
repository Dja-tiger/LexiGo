import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["components/lexigo-premium-app.tsx"],
    rules: {
      // This runtime owner restores an external sessionStorage snapshot and
      // resolves server continuation state. The transitions are covered by
      // reload/history/duplicate-submit E2E and are intentionally scoped here.
      "react-hooks/set-state-in-effect": "off",
      // The compiler rule treats the nullable custom-panel retry callback as
      // render-time ref access. DOM event paths remain covered by ownership tests.
      "react-hooks/refs": "off",
    },
  },
  {
    files: ["components/lexigo-learn-app.tsx"],
    rules: {
      // Temporary compiler probe: remove after the guest-preview reset is
      // folded into the final Learn controller state transition.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
