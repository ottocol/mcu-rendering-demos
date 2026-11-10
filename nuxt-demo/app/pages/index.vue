<template>
  <header class="mode-header"><a href="/" class="brand">MCU · <span>patrones de renderizado</span></a></header>
  <main class="container hub">
    <h1>La misma app, cuatro formas de renderizarla</h1>
    <p>
      Todas las rutas usan exactamente las mismas páginas y componentes.
      Lo único que cambia es la regla de <code>routeRules</code> en <code>nuxt.config.ts</code>.
    </p>

    <ul class="modes">
      <li v-for="m in VISIBLE_MODES" :key="m">
        <a :href="`/${m}`"><strong>{{ MODES[m]?.label }}</strong></a>
        <code>'/{{ m }}/**': {{ MODES[m]?.rule }}</code>
      </li>
    </ul>

    <h2>Otras demos</h2>
    <ul class="extra">
      <li><a href="/a">Versión A</a> y <a href="/b">versión B</a>: CSR y SSR sin etiquetas, para adivinar cuál es cuál.</li>
      <li><a href="/mismatch">Hydration mismatch</a>: mejor con <code>npm run dev</code>.</li>
    </ul>

    <p class="hint">
      Las reglas solo se aplican en producción: arranca con <code>npm run demo</code>, no con <code>npm run dev</code>.
    </p>
  </main>
</template>
