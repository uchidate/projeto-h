/** Últimos artistas e grupos vistos, guardados só no navegador (sem login e sem ir para o servidor). */
export interface Recente { slug: string; nome: string; foto: string | null; papel: string | null; /** Ausente = artista (registros antigos). */ tipo?: 'grupo' }

export const CHAVE_RECENTES = 'hh:recentes:v1'
const LIMITE = 8

const EVENTO = 'hh:recentes'

/** Texto cru guardado (ou vazio): estável entre leituras, para servir de snapshot ao React. */
export function lerRecentesCru(): string {
    try { return window.localStorage.getItem(CHAVE_RECENTES) ?? '' } catch { return '' }
}

export function interpretarRecentes(cru: string): Recente[] {
    try {
        const lista = cru ? JSON.parse(cru) : []
        return Array.isArray(lista) ? lista.filter(r => r && typeof r.slug === 'string' && typeof r.nome === 'string') : []
    } catch { return [] }
}

export function lerRecentes(): Recente[] {
    return interpretarRecentes(lerRecentesCru())
}

/** Avisa quem está lendo (mesma aba via evento próprio, outras abas via `storage`). */
export function assinarRecentes(aoMudar: () => void): () => void {
    window.addEventListener('storage', aoMudar)
    window.addEventListener(EVENTO, aoMudar)
    return () => { window.removeEventListener('storage', aoMudar); window.removeEventListener(EVENTO, aoMudar) }
}

export function registrarVisita(item: Recente): void {
    try {
        const resto = lerRecentes().filter(r => !(r.slug === item.slug && r.tipo === item.tipo))
        window.localStorage.setItem(CHAVE_RECENTES, JSON.stringify([item, ...resto].slice(0, LIMITE)))
        window.dispatchEvent(new Event(EVENTO))
    } catch { /* armazenamento bloqueado: o recurso simplesmente não aparece */ }
}

export function limparRecentes(): void {
    try { window.localStorage.removeItem(CHAVE_RECENTES); window.dispatchEvent(new Event(EVENTO)) } catch { /* idem */ }
}
