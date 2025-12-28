import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  extends: ['docus'],

  content: {
    experimental: {
      sqliteConnector: 'native'
    }
  },

  nitro: {
    static: true
  }
})
