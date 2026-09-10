module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: "detect" },
  },
  plugins: ["react", "react-hooks"],
  rules: {
    // Vite uses the new JSX transform (react/jsx-runtime) — React doesn't need to
    // be in scope for JSX to work, unlike the older Create React App convention
    // this rule assumes by default. Every page in this project relies on that.
    "react/react-in-jsx-scope": "off",
    "react/jsx-uses-react": "off",
    // No PropTypes anywhere in this codebase — turning this off rather than
    // generating a warning on every single prop in every component.
    "react/prop-types": "off",
  },
  ignorePatterns: ["dist", "node_modules"],
};
