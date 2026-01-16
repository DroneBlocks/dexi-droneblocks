// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // Server-side only (not exposed to client)
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  ssr: false,
  app: {
    head: {
      htmlAttrs: {
        'data-theme': 'light'
      }
    }
  },
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag === 'xml'
    }
  }
})
