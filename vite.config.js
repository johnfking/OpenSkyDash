import { fileURLToPath, URL } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import Fonts from 'unplugin-fonts/vite'
import { defineConfig } from 'vite'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [
    Vue({
      template: { transformAssetUrls },
    }),
    Vuetify({
      autoImport: true,
    }),
    Fonts({
      fontsource: {
        families: [
          {
            name: 'Roboto',
            weights: [100, 300, 400, 500, 700, 900],
            styles: ['normal', 'italic'],
          },
        ],
      },
    }),
  ],

  // 🟢 FIX 1: esbuild settings must be at the top level, NOT inside build
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
  },

  build: {
    // 🟢 FIX 2: Vite uses esbuild as the default minifier anyway,
    // so you can just let build.minify defaults handle it.
    minify: true,
  },

  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
  },
  server: {
    port: 5050,
    proxy: {
      '/api/blitz-js': {
        target: 'https://www.blitzortung.org/en/JS/live_lightning_maps.js',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/blitz-js/, ''),
      },
      '/blitz-js': {
        target: 'https://www.blitzortung.org/en/JS/live_lightning_maps.js',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/blitz-js/, ''),
      },
      '/api/kc2g': {
        target: 'https://prop.kc2g.com',
        changeOrigin: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) StationDashboard/1.0',
          Referer: 'https://prop.kc2g.com/',
        },
        rewrite: (path) =>
          path.replace(/^\/api\/kc2g\/point-prediction/, '/api/point_prediction.json'),
      },
      '/api-kc2g': {
        target: 'https://prop.kc2g.com',
        changeOrigin: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) StationDashboard/1.0',
          Referer: 'https://prop.kc2g.com/',
        },
        rewrite: (path) => path.replace(/^\/api-kc2g/, ''),
      },
    },
  },
})
