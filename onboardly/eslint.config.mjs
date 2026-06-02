import next from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...next,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "src/components/ui/**",
      "src/generated/**",
    ],
  },
];

export default eslintConfig;
