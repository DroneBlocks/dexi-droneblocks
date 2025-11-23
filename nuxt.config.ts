// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
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
