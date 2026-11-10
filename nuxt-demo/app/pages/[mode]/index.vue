<!--
  El listado. Este fichero sirve /csr, /ssr, /ssg, /swr (y /a, /b):
  el código es el mismo, lo que cambia es la regla de nuxt.config.ts.
-->
<script setup lang="ts">
import { NuxtLink } from '#components'

definePageMeta({ validate: route => isMode(route.params.mode) })

const { mode, info } = useMode()

// useAsyncData: si hay SSR, loadMovies() se ejecuta en el servidor y el
// resultado viaja en el payload del HTML. Al hidratar NO se repite la petición.
// Es lo mismo que haría useFetch('https://mcuapi.up.railway.app/api/v1/movies'),
// pero con copias de respaldo por si la API no responde (ver utils/mcu.ts).
const { data, error } = await useAsyncData('movies', loadMovies)

useHead({ title: info.hidden ? 'Películas del MCU' : `Películas del MCU · ${info.label}` })

function formatDate(iso: string | null) {
  if (!iso) return 'Sin fecha'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
</script>

<template>
  <ModeHeader />
  <main class="container">
    <h1>Películas del MCU</h1>
    <RenderInfo v-if="!info.hidden" :source="data?.source" />

    <p v-if="error" class="error">No se han podido cargar las películas.</p>

    <template v-else-if="data">
      <MovieFilterList :movies="data.released" :link-base="`/${mode}`" :link-component="NuxtLink" />

      <section v-if="data.upcoming.length" class="upcoming">
        <h2>Próximamente</h2>
        <ul>
          <li v-for="m in data.upcoming" :key="m.id">
            <NuxtLink :to="`/${mode}/${m.id}`">{{ m.title }}</NuxtLink>
            <span class="meta">{{ formatDate(m.release_date) }}</span>
          </li>
        </ul>
      </section>
    </template>
  </main>
</template>
