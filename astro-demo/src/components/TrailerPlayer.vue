<!--
  Componente COMPARTIDO: copiado tal cual en astro-demo/src/components.
  Se usa con hidratación perezosa: en Nuxt <LazyTrailerPlayer hydrate-on-visible>,
  en Astro <TrailerPlayer client:visible>. Su JS no se descarga hasta que
  el componente entra en pantalla: míralo en la pestaña Network al hacer scroll.
-->
<script setup>
import { ref, onMounted } from 'vue'

defineProps({
  url: { type: String, default: null },
  title: { type: String, required: true },
})

const playing = ref(false)
const hydrated = ref(false)

onMounted(() => {
  hydrated.value = true
  console.log(`[TrailerPlayer] hidratado a las ${new Date().toLocaleTimeString('es-ES')}`)
})
</script>

<template>
  <section class="trailer">
    <h2>Tráiler <small class="hydration" :class="{ on: hydrated }">{{ hydrated ? 'hidratado' : 'sin hidratar' }}</small></h2>
    <p v-if="!url" class="placeholder">No hay tráiler disponible para esta película.</p>
    <iframe
      v-else-if="playing"
      :src="url"
      :title="`Tráiler de ${title}`"
      allow="autoplay; fullscreen"
      allowfullscreen
    />
    <button v-else type="button" class="play" @click="playing = true">
      ▶ Ver el tráiler de {{ title }}
    </button>
  </section>
</template>
