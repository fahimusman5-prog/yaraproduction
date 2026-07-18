import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextCoreWebVitals,
  {
    ignores: [".next/**", "node_modules/**", "tmp/**", "reference/**", "YARA.html"],
    // These existing effects intentionally synchronize URL/catalog/form state.
    // Keep them visible as warnings until the client state model is redesigned.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/error-boundaries": "warn",
    },
  },
];

export default config;
