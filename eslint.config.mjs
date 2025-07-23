import { createConfigForNuxt } from "@nuxt/eslint-config";
import { includeIgnoreFile } from "@eslint/compat";
import { fileURLToPath } from "node:url";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

export default createConfigForNuxt({
  features: {
    tooling: true,
  },
}).prepend(includeIgnoreFile(gitignorePath, "Imported .gitignore patterns"));
