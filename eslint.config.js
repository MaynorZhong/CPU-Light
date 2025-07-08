import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  // Base configuration
  js.configs.recommended,

  // TypeScript configuration
  ...tseslint.configs.recommended,

  // React configuration
  pluginReact.configs.flat.recommended,

  // Files to lint
  {
    files: ["src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      ecmaVersion: 2020,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "react-hooks": pluginReactHooks,
    },
    rules: {
      // React rules
      "react/react-in-jsx-scope": "off", // Not needed in React 17+
      "react/prop-types": "off", // Using TypeScript for prop validation

      // React Hooks rules
      ...pluginReactHooks.configs.recommended.rules,

      // General rules
      "no-unused-vars": "off", // Handled by TypeScript
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "warn",
      "no-var": "error",

      // Import rules
      "no-duplicate-imports": "error",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // Prettier configuration (must be last)
  eslintConfigPrettier,
];
