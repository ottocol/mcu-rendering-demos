import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'

// Salida estática (SSG) por defecto: todo el HTML se genera en el build.
// La integración de Vue permite usar como "islas" los mismos .vue que en Nuxt.
export default defineConfig({
  integrations: [vue()],
})
