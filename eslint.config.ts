import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [
      "node_modules",
      "dist/**",
      "coverage/**",
      "*.config.js",
      "*.config.ts"
    ]
  },
  {
    files: ["src/**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    languageOptions: { globals: globals.browser },
    rules: {
      ...js.configs.recommended.rules,
      "eqeqeq": ["error", "always"],
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "curly": ["error", "all"],
      "no-var": "error",
      "prefer-const": "error"
    }

  },
  {
    files: ["test/**/*.{js,mjs,cjs,ts,mts,cts}", "**/*/*.test.ts", "**/*/*.spec.ts"],
    extends: [...tseslint.configs.recommended],
    rules: {
      "eqeqeq": ["error", "always"],
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "curly": ["error", "all"],
      "no-var": "error",
      "prefer-const": "error"

    }
  },
  {}
]);
