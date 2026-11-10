// Una sola app, cuatro estrategias de renderizado.
// El código de las páginas es EXACTAMENTE el mismo en todas las rutas:
// lo único que cambia es la regla asociada a cada prefijo.
//
// OJO: estas reglas solo se aplican en producción (npm run demo).
// En `nuxt dev` todo se comporta como SSR sin caché.

const MODES_PRERENDERED = ['/ssg']

export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: false },
  css: ['~/assets/main.css'],

  runtimeConfig: {
    public: {
      // Mirror opcional de la API, usado como primer respaldo si la API no responde.
      // Ejemplo: NUXT_PUBLIC_MCU_MIRROR=https://mi-mirror.onrender.com/api/v1 npm run demo
      // (necesita permitir CORS, porque en CSR lo llama el navegador)
      mcuMirror: '',
    },
  },

  routeRules: {
    '/csr/**': { ssr: false },          // CSR: el servidor solo envía el "cascarón"
    // '/ssr/**'                        // SSR: el comportamiento por defecto, no hace falta regla
    '/ssg/**': { prerender: true },     // SSG: HTML generado en el build
    '/swr/**': { swr: 30 },             // SWR: SSR cacheado, se regenera como mucho cada 30 s
    '/swr': { swr: 30 },                // (la caché de Nitro no aplica '/swr/**' a '/swr' a secas)

    // Versiones "A" y "B": CSR y SSR sin etiquetas, para adivinar cuál es cuál
    // (sin nombres que delaten qué es cada una)
    '/a/**': { ssr: false },
    // '/b/**' → SSR por defecto
  },

  nitro: {
    prerender: {
      // Nuxt descubre las páginas a prerenderizar siguiendo los enlaces
      // a partir de /ssg (el listado enlaza a cada película).
      routes: MODES_PRERENDERED,
      crawlLinks: true,
      // ...pero el selector de modo también enlaza a /ssr, /csr, etc.
      // y esas NO queremos convertirlas en estáticas.
      ignore: [
        (route: string) => !MODES_PRERENDERED.some(p => route === p || route.startsWith(p + '/')),
      ],
    },
  },

  hooks: {
    // Por defecto Nuxt añade <link rel="prefetch"> para los chunks de los
    // componentes Lazy: el navegador los DESCARGA en segundo plano nada más
    // cargar la página, aunque los EJECUTE (hidrate) más tarde.
    // Lo desactivamos para que en la pestaña Network se vea claramente que
    // el JS del tráiler llega al hacer scroll. Comenta este hook para ver
    // el comportamiento por defecto (que en una app real es el bueno).
    'build:manifest'(manifest) {
      for (const resource of Object.values(manifest)) resource.prefetch = false
    },
  },
})
