import eslint from "@eslint/js";
import globals from "globals";
import tselint from "typescript-eslint";

export default [
  eslint.configs.recommended,
  ...tselint.configs.recommended,
  {
    plugins: {
      tselint: tselint.plugin,
    },
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tselint.parser,
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
  },
  {
    rules: {
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  {
    ignores: ["dist", "docs"],
  },
  {
    files: ["src/**/*"],
  },
  {
    files: ["test/**/*.ts"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
];
