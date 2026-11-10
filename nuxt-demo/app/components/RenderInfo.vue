<!--
  La etiqueta que hace visible el patrón: DÓNDE y CUÁNDO se generó el HTML.

  useState es la clave: el valor se calcula UNA vez (en el servidor si hay SSR)
  y viaja al navegador dentro del payload. Al hidratar, el cliente reutiliza
  ese valor en lugar de recalcularlo. Compara con RenderInfoBroken.vue.

  La clave depende de la ruta: si navegas con un enlace interno (NuxtLink),
  la página nueva se renderiza en el navegador y la etiqueta lo dice.
-->
<script setup lang="ts">
defineProps<{ source?: string }>()

const route = useRoute()

const info = useState(`render-${route.fullPath}`, () => ({
  where: import.meta.prerender
    ? 'el servidor, durante el build'
    : import.meta.server ? 'el servidor' : 'el navegador',
  when: new Date().toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid', dateStyle: 'short', timeStyle: 'medium',
  }),
}))

const hydrated = ref(false)
onMounted(() => { hydrated.value = true })

const SOURCES: Record<string, string> = {
  api: 'API en vivo',
  mirror: 'mirror alternativo (la API no respondía)',
  cdn: 'copia estática en CDN (la API no respondía)',
  local: 'copia local del repo (sin conexión)',
}
</script>

<template>
  <aside class="render-info">
    <span>HTML generado en <strong>{{ info.where }}</strong> el <strong>{{ info.when }}</strong></span>
    <span class="hydration" :class="{ on: hydrated }">{{ hydrated ? 'Página interactiva' : 'Página sin hidratar' }}</span>
    <span v-if="source" class="source">Datos: {{ SOURCES[source] ?? source }}</span>
  </aside>
</template>
