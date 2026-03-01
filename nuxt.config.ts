// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  runtimeConfig: {
    // Server-side only (not exposed to client)
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    public: {
      rosHost: '', // override via NUXT_PUBLIC_ROS_HOST env var
    },
  },
  css: ['~/assets/css/main.css'],
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
