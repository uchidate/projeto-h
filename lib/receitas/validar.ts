import type { Receita } from './tipos'

const MIN_FONTES = 2
const MIN_PASSOS = 3
const MIN_INGREDIENTES = 3

/** Erros que impedem publicar a receita; lista vazia = válida. */
export function validarReceita(slug: string, r: Receita): string[] {
    const erros: string[] = []
    const falha = (msg: string) => erros.push(`${slug}: ${msg}`)

    if (!/^[a-z0-9-]+$/.test(slug)) falha('slug inválido')
    if (!Number.isInteger(r.porcoes) || r.porcoes < 1) falha('porcoes deve ser inteiro >= 1')
    if (!Number.isInteger(r.preparoMin) || r.preparoMin < 0) falha('preparoMin deve ser inteiro >= 0')
    if (!Number.isInteger(r.cozimentoMin) || r.cozimentoMin < 0) falha('cozimentoMin deve ser inteiro >= 0')
    if (r.preparoMin + r.cozimentoMin < 1) falha('tempo total deve ser > 0')

    if (!Array.isArray(r.ingredientes) || r.ingredientes.length < MIN_INGREDIENTES) {
        falha(`mínimo de ${MIN_INGREDIENTES} ingredientes`)
    } else if (r.ingredientes.some(i => !i.item?.trim() || !i.quantidade?.trim())) {
        falha('todo ingrediente precisa de item e quantidade')
    }

    if (!Array.isArray(r.passos) || r.passos.length < MIN_PASSOS) falha(`mínimo de ${MIN_PASSOS} passos`)
    else if (r.passos.some(p => p.trim().length < 15)) falha('passo curto demais (< 15 caracteres)')

    const fontes = Array.isArray(r.fontes) ? r.fontes : []
    if (fontes.length < MIN_FONTES) falha(`mínimo de ${MIN_FONTES} fontes`)
    for (const f of fontes) {
        if (!f.nome?.trim()) falha('fonte sem nome')
        if (!/^https:\/\/[^\s]+$/.test(f.url ?? '')) falha(`fonte com url inválida: ${f.url}`)
    }
    if (new Set(fontes.map(f => safeHost(f.url))).size < Math.min(fontes.length, MIN_FONTES)) {
        falha('as fontes precisam ser de sites diferentes')
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.conferidoEm ?? '')) falha('conferidoEm deve ser AAAA-MM-DD')
    return erros
}

function safeHost(url: string): string {
    try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}
