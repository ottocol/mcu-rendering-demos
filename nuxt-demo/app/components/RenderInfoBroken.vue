<!--
  La MISMA etiqueta que RenderInfo.vue, pero sin useState.

  El servidor ejecuta este código y escribe "el servidor".
  El navegador lo vuelve a ejecutar al hidratar y obtiene "el navegador".
  El HTML que llegó no coincide con lo que Vue esperaba: hydration mismatch.
  (En `npm run dev` el aviso de la consola dice exactamente qué no coincide.)
-->
<script setup lang="ts">
const where = import.meta.server ? 'el servidor' : 'el navegador'
const when = new Date().toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid' })
</script>

<template>
  <aside class="render-info broken">
    <span>HTML generado en <strong>{{ where }}</strong> a las <strong>{{ when }}</strong></span>
  </aside>
</template>
