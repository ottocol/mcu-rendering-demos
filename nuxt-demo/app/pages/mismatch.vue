<!-- Página SSR para ver un hydration mismatch. Mejor con `npm run dev` y la consola abierta. -->
<template>
  <header class="mode-header"><a href="/" class="brand">MCU · <span>patrones de renderizado</span></a></header>
  <main class="container">
    <h1>Hydration mismatch</h1>
    <p>Las dos etiquetas tienen el mismo código, salvo un detalle.</p>

    <h2>Con <code>useState</code></h2>
    <RenderInfo />

    <h2>Sin <code>useState</code></h2>
    <RenderInfoBroken />

    <p class="hint">
      Recarga con la CPU ralentizada (DevTools → Performance → CPU 6x):
      la segunda etiqueta cambia de texto al hidratar, y la consola avisa del error.
    </p>
  </main>
</template>
