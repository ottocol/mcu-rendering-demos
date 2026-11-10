# Demo Nuxt: CSR, SSR, SSG y SWR en la misma app

```bash
npm install
npm run demo        # build + servidor de producción en http://localhost:3000
```

Las reglas de `routeRules` solo se aplican en producción: no uses `npm run dev`, salvo para la página `/mismatch`.

| Ruta | Regla |
| --- | --- |
| `/csr` | `{ ssr: false }` |
| `/ssr` | por defecto |
| `/ssg` | `{ prerender: true }` |
| `/swr` | `{ swr: 30 }` |
| `/a`, `/b` | CSR y SSR sin etiquetas, para adivinar cuál es cuál (apartado 1 del recorrido) |
| `/mismatch` | hydration mismatch (mejor en dev) |

Ficheros clave:

- `nuxt.config.ts`: las reglas de renderizado y la configuración del prerendering.
- `app/pages/[mode]/index.vue` y `[id].vue`: listado y detalle, compartidos por todos los modos.
- `app/components/RenderInfo.vue`: la etiqueta «HTML generado en… el…».
- `app/components/RenderInfoBroken.vue`: la misma etiqueta sin `useState`.
- `app/components/MovieFilterList.vue` y `TrailerPlayer.vue`: compartidos con la demo de Astro.
- `app/utils/mcu.ts`: llamadas a la API, con copias de respaldo si no responde.
- `data/movies.json`: copia local de los datos, último respaldo sin conexión.

El recorrido guiado completo está en el [README principal](../README.md).
