// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  modules: ["@nuxt/a11y", "@nuxt/ui", "@nuxt/image", "@nuxt/hints"],
  css: ["~/assets/css/main.css"],
});
