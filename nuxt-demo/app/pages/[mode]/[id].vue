<script setup lang="ts">
definePageMeta({
  validate: route => isMode(route.params.mode) && /^\d+$/.test(String(route.params.id)),
})

const route = useRoute()
const { mode, info } = useMode()

// Equivale a useFetch(`https://mcuapi.up.railway.app/api/v1/movies/${id}`),
// con copias de respaldo (ver utils/mcu.ts)
const id = Number(route.params.id)
const { data, error } = await useAsyncData(`movie-${id}`, () => loadMovie(id))
const movie = computed(() => data.value?.movie)

useHead({ title: () => movie.value?.title ?? 'Película' })

function formatDate(iso?: string | null) {
  if (!iso) return 'Sin fecha'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
const boxOffice = computed(() => {
  const n = Number(movie.value?.box_office)
  return n ? `${Math.round(n / 1e6).toLocaleString('es-ES')} M$` : '—'
})
</script>

<template>
  <ModeHeader />
  <main class="container">
    <NuxtLink :to="`/${mode}`" class="back">← Todas las películas</NuxtLink>
    <RenderInfo v-if="!info.hidden" :source="data?.source" />

    <p v-if="error" class="error">No existe esa película.</p>

    <!--
      Hidratación perezosa: el JS de LazyTrailerPlayer no se descarga hasta que
      entra en pantalla. Por eso hay un hueco vacío a propósito antes del tráiler,
      para que empiece fuera de la vista inicial. Mientras tanto, un aviso se
      queda pegado al borde inferior (solo CSS, ver .scroll-cue en main.css).
    -->
    <div v-else-if="movie" class="scroll-area">
    <article class="detail">
      <!-- El cartel suele ser el elemento del LCP de esta página -->
      <img v-if="movie.cover_url" :src="movie.cover_url" :alt="`Cartel de ${movie.title}`" width="340" height="510" fetchpriority="high">
      <div>
        <h1>{{ movie.title }}</h1>
        <dl class="facts">
          <dt>Estreno</dt><dd>{{ formatDate(movie.release_date) }}</dd>
          <dt>Dirección</dt><dd>{{ movie.directed_by ?? '—' }}</dd>
          <dt>Duración</dt><dd>{{ movie.duration ? `${movie.duration} min` : '—' }}</dd>
          <dt>Fase</dt><dd>{{ movie.phase ?? '—' }} <template v-if="movie.saga">({{ movie.saga }})</template></dd>
          <dt>Taquilla</dt><dd>{{ boxOffice }}</dd>
        </dl>
        <p class="overview">{{ movie.overview ?? 'Sin sinopsis.' }}</p>
      </div>
    </article>
      <div class="scroll-gap" />
      <p class="scroll-cue">
        ↓ Sigue bajando: el tráiler está al final de la página.<br>
        Su JavaScript no se descarga hasta que aparece en pantalla (mira la pestaña Network).
      </p>
    </div>

    <LazyTrailerPlayer v-if="movie" hydrate-on-visible :url="movie.trailer_url" :title="movie.title" />
  </main>
</template>
