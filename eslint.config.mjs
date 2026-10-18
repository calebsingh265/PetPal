import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The home page's 3D scene. React Three Fiber's frame loop mutates
    // three.js objects (camera, instance matrices, textures) in place on
    // purpose: it is what keeps 60 fps animation out of React's render cycle.
    // The React Compiler rules below assume ordinary React state, so they are
    // switched off for this folder only.
    files: ["components/landing/scene/**"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/use-memo": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
