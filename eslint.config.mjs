import antfu from '@antfu/eslint-config'
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(antfu(
  {
    formatters: true,
    pnpm: false,
    ignores: [
      'app/components/ui/**',
      'app/data/**',
      'public/*.json',
      // A symlink to AGENTS.md; checks out as plain text on Windows but as a
      // real symlink on Linux CI, which ESLint's file reader can't lint either way.
      'CLAUDE.md',
    ],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-console': 'off',
      'node/prefer-global/process': 'off',
      'vue/no-v-html': 'off',
    },
  },
  {
    plugins: {
      'better-tailwindcss': eslintPluginBetterTailwindcss,
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: './app/assets/css/tailwind.css',
      },
    },
    rules: {
      ...eslintPluginBetterTailwindcss.configs['recommended-warn'].rules,
    },
  },
))
