export interface ModeInfo {
  label: string
  rule: string
  hidden?: boolean // versiones A/B: no delatar qué es cada una
}

export const MODES: Record<string, ModeInfo> = {
  csr: { label: 'CSR', rule: "{ ssr: false }" },
  ssr: { label: 'SSR', rule: '(por defecto)' },
  ssg: { label: 'SSG', rule: '{ prerender: true }' },
  swr: { label: 'SWR', rule: '{ swr: 30 }' },
  a: { label: 'Versión A', rule: '', hidden: true },
  b: { label: 'Versión B', rule: '', hidden: true },
}

export const VISIBLE_MODES = Object.keys(MODES).filter(m => !MODES[m]!.hidden)

export const isMode = (m: unknown): m is string => typeof m === 'string' && m in MODES

export function useMode() {
  const route = useRoute()
  const mode = String(route.params.mode)
  return { mode, info: MODES[mode]! }
}
