import { createConfigForNuxt } from '@nuxt/eslint-config'
import { includeIgnoreFile } from '@eslint/compat'
import { fileURLToPath } from 'node:url'

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url))

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: {
      semi: false,
      quotes: 'single',
      commaDangle: 'never',
      braceStyle: '1tbs'
    }
  }
}).prepend(includeIgnoreFile(gitignorePath, 'Imported .gitignore patterns'))
