<!--
  Componente COMPARTIDO: este mismo fichero está copiado tal cual en
  astro-demo/src/components. Por eso no usa nada específico de Nuxt
  (ni auto-imports ni NuxtLink directamente): el enlace se pasa por prop.
-->
<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  movies: { type: Array, required: true },
  linkBase: { type: String, required: true },
  // 'a' (navegación MPA, recarga la página) o NuxtLink (navegación SPA)
  linkComponent: { type: [String, Object], default: 'a' },
})

const query = ref('')

// Mientras el componente no se ha hidratado, la caja de texto existe
// (es HTML), pero escribir en ella no filtra nada.
const hydrated = ref(false)
onMounted(() => { hydrated.value = true })

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? props.movies.filter(m => m.title.toLowerCase().includes(q)) : props.movies
})

// Formateamos "a mano" para que servidor y navegador produzcan
// exactamente el mismo texto (si no, hydration mismatch).
function formatDate(iso) {
  if (!iso) return 'Sin fecha'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
</script>

<template>
  <section class="movie-list">
    <div class="filter">
      <input
        v-model="query"
        type="search"
        placeholder="Filtrar por título…"
        aria-label="Filtrar películas por título"
      >
      <span class="hydration" :class="{ on: hydrated }">
        {{ hydrated ? 'Filtro activo' : 'Sin hidratar: el filtro aún no responde' }}
      </span>
    </div>

    <p class="count">{{ filtered.length }} de {{ movies.length }} películas</p>

    <ul class="grid">
      <li v-for="(m, i) in filtered" :key="m.id">
        <component :is="linkComponent" :href="`${linkBase}/${m.id}`" class="card">
          <img
            v-if="m.cover_url"
            :src="m.cover_url"
            :alt="`Cartel de ${m.title}`"
            :loading="i < 6 ? 'eager' : 'lazy'"
            width="200"
            height="300"
          >
          <div v-else class="no-cover">{{ m.title }}</div>
          <span class="title">{{ m.title }}</span>
          <span class="meta">{{ formatDate(m.release_date) }}<template v-if="m.phase"> · Fase {{ m.phase }}</template></span>
        </component>
      </li>
    </ul>

    <p v-if="!filtered.length" class="empty">Ninguna película contiene «{{ query }}».</p>
  </section>
</template>
