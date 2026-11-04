import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([".next/**", ".dist/**", ".preview/**", "next-env.d.ts"]),
  { files: ["scripts/**/*.cjs", "tests/**/*.cjs"], rules: { "@typescript-eslint/no-require-imports": "off" } },
]);
