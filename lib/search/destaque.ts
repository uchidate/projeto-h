/**
 * Trechos do texto a destacar para a consulta, sem HTML: quem renderiza decide
 * como marcar. Ignora acento e caixa ("jose" marca "José") e marca cada palavra
 * da consulta ("jisoo blackpink" marca as duas), alem da frase inteira.
 */
export type Trecho = { texto: string; marcado: boolean }

// Dobra caractere a caractere para preservar os indices do texto original.
function dobrar(c: string): string {
    return c.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC')
}

export function trechosDestacados(texto: string, consulta: string): Trecho[] {
    const sem = [{ texto, marcado: false }]
    const chars = [...texto]
    const dobrados = chars.map(dobrar)
    if (dobrados.some(d => d.length !== 1)) return sem
    const base = dobrados.join('')

    const q = dobrar(consulta.trim())
    const termos = [...new Set([q, ...q.split(/\s+/).filter(p => p.length >= 2)])]
        .filter(t => t.length >= 2)
        .sort((a, b) => b.length - a.length)
    if (!termos.length) return sem

    const marca = new Array<boolean>(chars.length).fill(false)
    for (const t of termos) {
        for (let i = base.indexOf(t); i !== -1; i = base.indexOf(t, i + t.length)) {
            for (let j = i; j < i + t.length; j++) marca[j] = true
        }
    }
    if (!marca.some(Boolean)) return sem

    const trechos: Trecho[] = []
    chars.forEach((c, i) => {
        const ultimo = trechos[trechos.length - 1]
        if (ultimo && ultimo.marcado === marca[i]) ultimo.texto += c
        else trechos.push({ texto: c, marcado: marca[i] })
    })
    return trechos
}
