// Los datos se piden UNA vez, durante el build (esto es SSG).
// Mismos respaldos que en Nuxt: API → mirror propio (opcional) → copia en CDN → copia local.
//   MCU_MIRROR=https://mi-mirror.onrender.com/api/v1 npm run build
import bundled from '../data/movies.json'

const API = 'https://mcuapi.up.railway.app/api/v1'
const MIRROR = process.env.MCU_MIRROR
const CDN = 'https://cdn.jsdelivr.net/gh/AugustoMarcelo/mcuapi@master/data/movies.json'

async function fetchJson(url, ms = 4000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

let cache // el listado y los ~40 detalles comparten una sola petición

async function load() {
  try {
    const res = await fetchJson(`${API}/movies?is_mcu=true&limit=100`)
    return { source: 'api', movies: res.data }
  }
  catch (e) { console.warn('[mcu] api no disponible:', e.message) }
  if (MIRROR) {
    try {
      const res = await fetchJson(`${MIRROR}/movies?is_mcu=true&limit=100`)
      return { source: 'mirror', movies: (Array.isArray(res) ? res : res.data).filter(m => m.is_mcu) }
    }
    catch (e) { console.warn('[mcu] mirror no disponible:', e.message) }
  }
  try {
    const list = await fetchJson(CDN)
    return { source: 'cdn', movies: list.filter(m => m.is_mcu) }
  }
  catch (e) { console.warn('[mcu] cdn no disponible, usando la copia local:', e.message) }
  return { source: 'local', movies: bundled.filter(m => m.is_mcu) }
}

export function getAllMovies() {
  cache ??= load()
  return cache
}

const byDate = (a, b) => (a.release_date ?? '9999').localeCompare(b.release_date ?? '9999')

export async function getMovieList() {
  const { source, movies } = await getAllMovies()
  const today = new Date().toISOString().slice(0, 10)
  const lean = [...movies].sort(byDate).map(({ id, title, release_date, cover_url, phase }) =>
    ({ id, title, release_date, cover_url, phase }))
  return {
    source,
    released: lean.filter(m => m.release_date && m.release_date <= today),
    upcoming: lean.filter(m => !m.release_date || m.release_date > today),
  }
}

export function formatDate(iso) {
  if (!iso) return 'Sin fecha'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export const SOURCES = {
  api: 'API en vivo',
  mirror: 'mirror alternativo (la API no respondía)',
  cdn: 'copia estática en CDN (la API no respondía)',
  local: 'copia local del repo (sin conexión)',
}
