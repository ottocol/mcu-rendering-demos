# Demo Astro: las mismas páginas con islas

```bash
npm install
npm run demo        # build + preview en http://localhost:4321
```

- `src/components/ListPage.astro`: listado. El filtro y la lista son una isla (`client:load`); «Próximamente» es HTML estático.
- `src/components/DetailPage.astro`: detalle. Todo estático salvo el tráiler (`client:visible`).
- `src/components/Layout.astro`: la cabecera común y, en la versión moderna, las View Transitions y las Speculation Rules.
- `src/pages/`: las rutas. `/` y `/movies/<id>` son la MPA clásica; `/vt/` y `/vt/movies/<id>`, la MPA moderna, con las mismas páginas.
- `src/components/MovieFilterList.vue` y `TrailerPlayer.vue`: **copias exactas** de los de `nuxt-demo`.

Con la pestaña Network filtrada por JS, la página de detalle no descarga nada hasta que haces scroll hasta el tráiler. En la versión moderna, además, la navegación se anima y la página siguiente se prerenderiza al pasar el ratón por el enlace (Chrome).

El recorrido guiado completo está en el [README principal](../README.md).
