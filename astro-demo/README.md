# Demo Astro: las mismas páginas con islas

```bash
npm install
npm run demo        # build + preview en http://localhost:4321
```

- `src/pages/index.astro`: listado. El filtro y la lista son una isla (`client:load`); «Próximamente» es HTML estático.
- `src/pages/movies/[id].astro`: detalle. Todo estático salvo el tráiler (`client:visible`).
- `src/components/MovieFilterList.vue` y `TrailerPlayer.vue`: **copias exactas** de los de `nuxt-demo`.

Con la pestaña Network filtrada por JS, la página de detalle no descarga nada hasta que haces scroll hasta el tráiler.

El recorrido guiado completo está en el [README principal](../README.md).
