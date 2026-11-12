# Patrones de renderizado con la API del MCU

Dos demos para entender cómo se reparten el trabajo de generar el HTML el servidor y el navegador:

| Carpeta | Qué enseña |
| --- | --- |
| [`nuxt-demo/`](nuxt-demo) | La **misma app** servida con CSR, SSR, SSG y SWR a la vez, cada una bajo un prefijo de ruta. También hidratación, payload, hydration mismatch e hidratación perezosa. |
| [`astro-demo/`](astro-demo) | Las mismas páginas en Astro, con **los mismos componentes `.vue`** usados como islas. Sirve para comparar cuánto JavaScript descarga cada enfoque y la navegación MPA frente a SPA, y para ver una MPA «moderna» con View Transitions y Speculation Rules. |

La app es sencilla a propósito: un listado de películas con filtro, una página de detalle y una sección de próximos estrenos. Lo interesante no es lo que hace, sino cómo se genera.

## Cómo arrancarlas

Necesitas Node.js 22.22 o superior.

```bash
cd nuxt-demo && npm install && npm run demo     # http://localhost:3000
cd astro-demo && npm install && npm run demo    # http://localhost:4321
```

> **Importante:** en Nuxt usa `npm run demo`, que compila la app y arranca el servidor de producción. Con `npm run dev` las reglas de renderizado **no se aplican** y todo se comporta como SSR sin caché. La única excepción es el experimento del *hydration mismatch*, que se ve mejor en modo desarrollo.

También puedes abrir cada carpeta en StackBlitz sin instalar nada: `https://stackblitz.com/github/<usuario>/<repo>/tree/main/nuxt-demo` (o `astro-demo`).

Para casi todos los experimentos te harán falta las **DevTools del navegador** (F12), sobre todo las pestañas Network y Console.

## De dónde salen los datos

De la [MCU API](https://github.com/AugustoMarcelo/mcuapi) (`https://mcuapi.up.railway.app/api/v1`). Las páginas la llaman directamente, como harías en cualquier app; el código está en `nuxt-demo/app/utils/mcu.ts`. Según el modo, esa llamada se hace en el servidor o en el navegador, y eso es justo una de las cosas que vas a observar.

La API admite como mucho **100 peticiones por minuto y por IP**. Si no responde o te ha limitado, la app prueba con copias de respaldo, por este orden:

1. Un mirror de la API, si lo configuras con una variable de entorno:
   ```bash
   NUXT_PUBLIC_MCU_MIRROR=https://tu-mirror.example.com/api/v1 npm run demo   # Nuxt
   MCU_MIRROR=https://tu-mirror.example.com/api/v1 npm run demo               # Astro
   ```
   Debe responder igual que la API en `/movies` y, opcionalmente, en `/movies/:id`. Como en modo CSR lo llama el navegador, tiene que permitir CORS.
2. La copia estática de los datos en jsDelivr.
3. La copia que va en el repo (`nuxt-demo/data/movies.json` y `astro-demo/src/data/movies.json`).

La etiqueta de cada página indica de dónde han salido los datos. Si pone «copia local», no hay conexión, pero todo funciona igual.

---

# Recorrido guiado

Sigue los apartados en orden: cada uno se apoya en el anterior.

## 1. Dos versiones de la misma app

Antes de leer nada más, abre `/a` y `/b` en dos pestañas. Una genera el HTML en el navegador y la otra en el servidor, pero la URL no lo dice.

1. Se ven iguales. ¿Sabrías decir cuál es cuál?
2. Mira el código fuente de cada una (**Ctrl+U**, o **⌘+Option+U** en Mac). En una solo hay un `<div id="__nuxt"></div>` vacío y unos scripts. En la otra está todo el HTML de las películas.
3. Desactiva JavaScript (DevTools → **Ctrl/⌘+Shift+P** → «Disable JavaScript») y recarga las dos. Una se queda en blanco. La otra muestra el listado, pero el filtro no hace nada.

Quédate con la pregunta de por qué pasa esto: la responden los apartados 3 y 4.

## 2. Qué ve quien no ejecuta JavaScript

```bash
curl -s localhost:3000/csr | grep -c "Iron Man"    # 0
curl -s localhost:3000/ssr | grep -c "Iron Man"    # 1
```

`curl` descarga el HTML sin ejecutar nada, igual que muchos crawlers (la mayoría de los de IA, por ejemplo). Para ellos, una página renderizada solo en el cliente está vacía. Es uno de los motivos por los que el SEO es un argumento a favor de generar el HTML en el servidor.

## 3. Cuándo y dónde se genera el HTML

Abre la portada (`/`): cada modo es un enlace y al lado aparece su regla. Ahora abre `nuxt-demo/nuxt.config.ts`. **El código de las páginas es el mismo en las cuatro rutas; lo único que cambia es la regla de `routeRules`.**

Cada página muestra una etiqueta que dice **dónde y cuándo** se generó su HTML. Recarga varias veces en cada modo:

| Modo | Qué dice la etiqueta al recargar |
| --- | --- |
| `/csr` | «el navegador», con la hora actual |
| `/ssr` | «el servidor», con una hora nueva en cada recarga |
| `/ssg` | «el servidor, durante el build», siempre la misma hora |
| `/swr` | «el servidor», y la hora no cambia durante 30 s |

**Quién llama a la API.** Abre DevTools → Network y filtra por `railway`. Recarga cada modo:

| Modo | Petición a la API en Network |
| --- | --- |
| `/csr` | Sí: la hace tu navegador |
| `/ssr`, `/swr` | No: la hizo el servidor antes de enviarte el HTML |
| `/ssg` | No: se hizo una sola vez, durante el build |

Es el mismo código en los tres casos; lo que cambia es dónde se ejecuta.

**SWR (stale-while-revalidate) paso a paso.** Apunta la hora que muestra `/swr`. Espera más de 30 segundos y recarga: **sigue saliendo la vieja**, porque esa petición recibe la copia caducada y, a la vez, dispara la regeneración en segundo plano. Recarga otra vez y ya aparece la nueva. Nadie espera a que se genere la página, a cambio de que alguien pueda ver contenido con unos segundos de retraso. En DevTools → Network, mira las cabeceras de la respuesta: `cache-control: s-maxage=30, stale-while-revalidate`.

**SSG y el build.** En la salida de `npm run build` verás `Prerendered 90 routes`: el listado, una página por película y sus ficheros `_payload.json`. Nuxt las descubre siguiendo los enlaces a partir de `/ssg`. Quedan como ficheros estáticos en `.output/public/ssg/`.

**Navegación mixta.** Entra en `/ssr` y pincha en una película: la etiqueta dice «el navegador», y en Network aparece una petición a la API (`/movies/<id>`) hecha por tu navegador. Cuando entras escribiendo la URL, el HTML viene del servidor; cuando navegas con enlaces internos (`NuxtLink`), Nuxt se comporta como una SPA y renderiza en el cliente. En `/ssg` es distinto: al navegar no hay petición a la API, sino al `_payload.json` de esa película, que se generó en el build junto con su HTML.

Por eso el selector de modo de la cabecera usa enlaces `<a>` normales y no `NuxtLink`: para comparar modos hay que hacer una petición nueva al servidor.

Ya puedes responder a la primera pregunta del apartado 1: `/a` es CSR y `/b` es SSR.

## 4. El precio de la interactividad

### Los datos viajan con el HTML (payload)

En `/ssr`, abre el código fuente y busca `__NUXT_DATA__`: el resultado de `useAsyncData` va serializado dentro del propio HTML. Por eso, como acabas de ver en Network, **al hidratar no se repite la petición** a la API: el navegador reutiliza esos datos. En `/ssg` el payload va en un fichero aparte, `_payload.json`.

### El «uncanny valley»

En DevTools, ralentiza la CPU (Performance → **CPU: 6x slowdown**) y la red (Network → **Slow 4G**). Recarga `/ssr`:

- El listado aparece pronto: buen FCP y LCP.
- Junto al filtro pone **«Sin hidratar: el filtro aún no responde»**. Escribe algo: no filtra. Incluso puede que lo escrito se borre al hidratar.
- Cuando cambia a **«Filtro activo»**, ya funciona.

Repite en `/csr`: ni siquiera hay caja de texto hasta que llega el JavaScript.

¿Y las métricas? INP mide cuánto tarda la página en responder a cada interacción. Si interactúas mientras se está hidratando, tu evento espera a que el hilo principal quede libre, y eso empeora el INP. Pero si pulsas algo que todavía no tiene su manejador conectado, simplemente no pasa nada, y ninguna métrica lo recoge bien. En una prueba de laboratorio (Lighthouse), lo más parecido es TBT (*Total Blocking Time*): cuánto tiempo bloquea el hilo principal la carga, hidratación incluida.

### Hydration mismatch

Arranca en modo desarrollo (`npm run dev`) y abre `/mismatch` con la consola abierta. Las dos etiquetas son el mismo componente, una con `useState` (`RenderInfo.vue`) y otra sin él (`RenderInfoBroken.vue`). La consola muestra:

```
[Vue warn]: Hydration text content mismatch
  - rendered on server: el servidor
  - expected on client: el navegador
```

El servidor ejecuta el `setup` del componente y escribe «el servidor». Al hidratar, el navegador lo vuelve a ejecutar y obtiene «el navegador»: el HTML recibido no coincide con lo que Vue esperaba. `useState` lo evita porque el valor calculado en el servidor viaja en el payload y el cliente lo reutiliza. En producción solo aparece un aviso genérico, `Hydration completed but contains mismatches`.

### Hidratación perezosa

Entra **escribiendo la URL** en `/ssr/1`, con Network filtrado por JS. El tráiler está al final de la página, fuera de la vista inicial, y su indicador dice «sin hidratar». Haz scroll: aparece un fichero JS nuevo y pequeño, la consola muestra `[TrailerPlayer] hidratado` y el indicador cambia.

El código está en `pages/[mode]/[id].vue`: `<LazyTrailerPlayer hydrate-on-visible />`.

Un matiz: por defecto Nuxt **descarga** ese fichero enseguida, en segundo plano (`<link rel="prefetch">`), y solo retrasa su **ejecución**. En esta demo está desactivado con un hook en `nuxt.config.ts` para que la descarga se vea al hacer scroll. Comenta el hook, vuelve a compilar y compara.

### Islas: Nuxt frente a Astro

Arranca `astro-demo` (`localhost:4321`). Usa los mismos componentes `MovieFilterList.vue` y `TrailerPlayer.vue`, copiados tal cual. Con Network filtrado por JS:

| Página | Nuxt (`/ssg`) | Astro |
| --- | --- | --- |
| Listado, al cargar | ~210 KB | ~77 KB |
| Detalle, al cargar | ~210 KB | **0 KB** |
| Detalle, tras hacer scroll hasta el tráiler | ~211 KB | ~77 KB |

*(Tamaños sin comprimir, medidos con Chrome; pueden variar un poco entre versiones.)*

- En Nuxt, cada página carga el framework y la app entera, aunque hidrate algunas partes más tarde.
- En Astro, la página de detalle **no carga nada de JavaScript** hasta que el tráiler entra en pantalla (`client:visible`). Solo entonces llegan Vue y el componente.
- **En el listado la diferencia es menor.** El filtro tiene que controlar la lista, así que la lista va dentro de la isla y la isla acaba siendo casi toda la página. Las islas funcionan mejor cuando la interactividad está localizada en partes pequeñas.
- **Navegación.** Al pinchar una película en Astro se carga una página HTML completa (MPA). En Nuxt se descarga un payload JSON y la página se renderiza en el cliente (SPA).

### Las MPA vuelven

La demo de Astro tiene dos versiones de las mismas páginas, que se alternan con los botones de la cabecera:

- **MPA clásica** (`/`): cada clic carga un documento HTML nuevo, con su destello en blanco.
- **MPA moderna** (`/vt/`): lo mismo, más dos funciones del navegador que se activan sin escribir JavaScript (están en `src/components/Layout.astro`):
  1. **View Transitions entre documentos.** Con `@view-transition { navigation: auto; }` en el CSS de las dos páginas, el navegador anima el cambio. Los elementos que tienen el mismo `view-transition-name` en las dos páginas se animan de una posición a otra: aquí, la cabecera y el cartel de la película (`poster-<id>`).
  2. **Speculation Rules.** Un `<script type="speculationrules">` le pide al navegador que **prerenderice** la página de destino cuando pasas el ratón unos 200 ms por un enlace (`"eagerness": "moderate"`). El clic posterior es instantáneo.

Pruébalo en Chrome:

1. En la MPA clásica, pincha una película: recarga completa.
2. Cambia a la MPA moderna y haz lo mismo: el cartel «vuela» de la rejilla al detalle y no hay destello.
3. Con Network abierto, pasa el ratón por una película sin pinchar: aparece la petición del documento **antes** del clic. En *Application → Speculative loads* ves qué páginas se han prerenderizado y por qué.
4. Fíjate en que la página de detalle sigue cargando **0 KB de JavaScript**: sensación de SPA sin SPA.

En Firefox funciona igual, pero sin animación ni prerender: es una mejora progresiva. Las View Transitions entre documentos funcionan en Chrome, Edge y Safari; las Speculation Rules, solo en navegadores basados en Chromium. Si el prerender no aparece, revisa que Chrome tenga activado *Configuración → Rendimiento → Precargar páginas* y que no esté en modo de ahorro de energía o de datos.

## Comprueba que lo has entendido

1. En `/csr` aparece en Network una petición a la API y en `/ssr` no, aunque el código de la página es el mismo. ¿Por qué? ¿Y qué pasa en `/ssr` si después pinchas en una película?
2. ¿Por qué la etiqueta de `/ssg/5` dice «el servidor, durante el build» si entras escribiendo la URL, y «el navegador» si llegas pinchando desde el listado?
3. Recargas `/swr` dos veces, separadas por 40 segundos. ¿Qué hora muestra cada una y por qué?
4. ¿Por qué `RenderInfoBroken.vue` produce un *hydration mismatch*? ¿Cómo lo arregla `useState`?
5. Una tienda online tiene estas rutas: portada, ficha de producto, carrito, panel de administración, blog y resultados de búsqueda. ¿Qué regla de `routeRules` pondrías en cada una y por qué?
6. ¿Por qué en Astro la página de detalle no descarga JavaScript al cargarse y el listado sí? ¿Cómo cambiarías el diseño del listado para que necesitara menos?

## Detalles técnicos que pueden sorprenderte

- **`'/swr'` necesita su propia regla.** La caché de Nitro (el servidor que usa Nuxt) registra `'/swr/**'` como ruta, y esa ruta no incluye `/swr` a secas, aunque el resto de reglas sí la incluyan. Por eso aparece duplicada en `nuxt.config.ts`.
- **`useAsyncData` en vez de `useFetch`.** Las páginas no usan `useFetch(url)` porque necesitan probar varias fuentes si la API falla. `useAsyncData` con `$fetch` dentro hace lo mismo, con el mismo comportamiento de payload e hidratación.
- **El build no hace 45 peticiones.** Al prerenderizar `/ssg`, cada página de detalle necesitaría su propia petición a la API. Para no acercarse al límite, durante el build se pide el listado completo una vez y cada página busca en él su película (`loadMovie` en `app/utils/mcu.ts`).
- **Sin reintentos automáticos.** `$fetch` reintenta una vez por defecto si la petición falla, también ante un 429. Está desactivado para no duplicar peticiones justo cuando la API está limitando.
- **El prerendering necesita los datos al compilar.** Sin conexión, `npm run build` usa la copia local, y la etiqueta de `/ssg` lo indica.
- **Los componentes compartidos no usan nada propio de Nuxt.** El tipo de enlace llega por la prop `linkComponent`: `NuxtLink` en Nuxt y `<a>` normal en Astro.
