const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        vi: "readonly",
        afterEach: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn",
      "no-case-declarations": "warn",
      "no-useless-assignment": "warn"
    }
  },
  {
    ignores: ["node_modules/**", "playwright-report/**", "test-results/**"]
  }
];
