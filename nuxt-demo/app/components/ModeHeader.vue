<!--
  Selector de modo. IMPORTANTE: usa <a> normales, no NuxtLink.
  Para comparar modos hay que ENTRAR en la URL (petición nueva al servidor).
  Con NuxtLink la navegación sería en el cliente y el modo no se notaría.
-->
<script setup lang="ts">
const route = useRoute()
const { mode, info } = useMode()

// /ssr/5 → "/5", para saltar a la misma página en otro modo
const rest = computed(() => route.path.replace(/^\/[^/]+/, ''))
</script>

<template>
  <header class="mode-header">
    <a href="/" class="brand">MCU · <span>patrones de renderizado</span></a>
    <nav v-if="!info.hidden" aria-label="Modo de renderizado">
      <a
        v-for="m in VISIBLE_MODES"
        :key="m"
        :href="`/${m}${rest}`"
        :class="{ current: m === mode }"
        :title="`routeRules: ${MODES[m]?.rule}`"
      >{{ MODES[m]?.label }}</a>
    </nav>
    <span v-else class="mode-label">{{ info.label }}</span>
  </header>
</template>
