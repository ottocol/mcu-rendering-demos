// Acceso a la API del MCU.
//
// Las páginas llaman a la API directamente. Este código se ejecuta donde
// corresponda según el modo de renderizado:
//   - SSR y SWR: en el servidor, al generar el HTML.
//   - SSG: en el servidor, durante el build.
//   - CSR, o al navegar con enlaces internos: en el navegador.
// Abre la pestaña Network en /csr y en /ssr y compara.
//
// Si la API no responde (o devuelve 429 por pasar de 100 peticiones/minuto
// desde la misma IP), se prueba con varias copias de respaldo, por orden:
//   1. Un mirror propio de la API, si se configura con NUXT_PUBLIC_MCU_MIRROR
//   2. La copia estática de los datos en jsDelivr
//   3. La copia que va dentro del repo (data/movies.json)

const API = 'https://mcuapi.up.railway.app/api/v1'
const CDN = 'https://cdn.jsdelivr.net/gh/AugustoMarcelo/mcuapi@master/data/movies.json'
// Sin reintentos: por defecto $fetch reintenta una vez, también ante un 429,
// y eso duplicaría las peticiones justo cuando la API nos está limitando.
const OPTS = { timeout: 3000, retry: 0 } as const

// Para el listado pedimos solo las columnas que se pintan:
// es lo que acabará serializado en el payload del HTML.
const LIST_COLUMNS = 'id,title,release_date,cover_url,phase,is_mcu'

export type DataSource = 'api' | 'mirror' | 'cdn' | 'local'

export interface Movie {
  id: number
  title: string
  release_date: string | null
  cover_url: string | null
  phase?: number | null
  is_mcu?: boolean
  trailer_url?: string | null
  overview?: string | null
  directed_by?: string | null
  duration?: number | null
  box_office?: string | null
  saga?: string | null
}

// ---------- Utilidades ----------

type Attempt<T> = [DataSource, () => Promise<T>]

async function firstThatWorks<T>(attempts: Attempt<T>[]) {
  for (const [source, attempt] of attempts) {
    try {
      return { source, value: await attempt() }
    }
    catch (e) {
      console.warn(`[mcu] ${source} no disponible:`, (e as Error).message)
    }
  }
  throw createError({ statusCode: 404, statusMessage: 'No se han encontrado los datos' })
}

// La API devuelve { data: [...], total, ... }; las copias estáticas, un array.
async function fetchList(url: string, columns?: string): Promise<Movie[]> {
  const res = await $fetch<Movie[] | { data: Movie[] }>(url, {
    query: url === CDN ? undefined : { is_mcu: true, limit: 100, columns },
    ...OPTS,
  })
  return Array.isArray(res) ? res : res.data
}

async function loadLocalCopy(): Promise<Movie[]> {
  // Import dinámico: los 100 KB del JSON solo se descargan si hacen falta.
  const { default: movies } = await import('~~/data/movies.json')
  return movies as Movie[]
}

function findOrThrow(movies: Movie[], id: number) {
  const movie = movies.find(m => m.id === id)
  if (!movie) throw new Error(`no existe la película ${id}`)
  return movie
}

// Respaldos para el listado completo, en orden
function listFallbacks(mirror: string, columns?: string): Attempt<Movie[]>[] {
  return [
    ...(mirror ? [['mirror', () => fetchList(`${mirror}/movies`, columns)] as Attempt<Movie[]>] : []),
    ['cdn', () => fetchList(CDN)],
    ['local', loadLocalCopy],
  ]
}

// ---------- Listado ----------

export async function loadMovies() {
  const mirror = useRuntimeConfig().public.mcuMirror

  const { source, value } = await firstThatWorks([
    ['api', () => fetchList(`${API}/movies`, LIST_COLUMNS)],
    ...listFallbacks(mirror, LIST_COLUMNS),
  ])

  // Las copias estáticas traen todas las películas (no solo las del MCU)
  // y todos los campos: filtramos y dejamos solo lo que se pinta.
  const today = new Date().toISOString().slice(0, 10)
  const movies = value
    .filter(m => m.is_mcu)
    .map(({ id, title, release_date, cover_url, phase }) => ({ id, title, release_date, cover_url, phase }))
    .sort((a, b) => (a.release_date ?? '9999').localeCompare(b.release_date ?? '9999'))

  return {
    source,
    released: movies.filter(m => m.release_date && m.release_date <= today),
    upcoming: movies.filter(m => !m.release_date || m.release_date > today),
  }
}

// ---------- Detalle ----------

// Durante el build se prerenderizan unas 45 páginas de detalle seguidas.
// Para no hacer 45 peticiones a la API, en ese caso concreto se pide el
// listado completo una vez y cada página busca en él su película.
let prerenderList: Promise<{ source: DataSource, value: Movie[] }> | undefined

export async function loadMovie(id: number) {
  const mirror = useRuntimeConfig().public.mcuMirror

  if (import.meta.prerender) {
    prerenderList ??= firstThatWorks([
      ['api', () => fetchList(`${API}/movies`)],
      ...listFallbacks(mirror),
    ])
    const { source, value } = await prerenderList
    return { source, movie: findOrThrow(value, id) }
  }

  const { source, value } = await firstThatWorks<Movie>([
    ['api', () => $fetch<Movie>(`${API}/movies/${id}`, OPTS)],
    ...(mirror ? [['mirror', () => $fetch<Movie>(`${mirror}/movies/${id}`, OPTS)] as Attempt<Movie>] : []),
    ['cdn', async () => findOrThrow(await fetchList(CDN), id)],
    ['local', async () => findOrThrow(await loadLocalCopy(), id)],
  ])
  return { source, movie: value }
}
