/**
 * Grafias alternativas de um nome coreano romanizado.
 *
 * A romanização varia entre fontes (Moo/Mu, Jin-sung/Jinsung, ordem ocidental ou
 * coreana), e as pessoas buscam pela que viram: em 09/2026 "mu jin-sung filmes e
 * programas de tv" teve 320 impressões e 0 cliques numa página chamada
 * "Moo Jin-sung". Expor as variantes dá ao Google o texto para casar essa busca.
 *
 * Só equivalências seguras, nunca inferência: `oo`->`u` (Moo/Mu, Yoo/Yu), hífen
 * removido e ordem invertida de nome com duas partes. Uma grafia inventada
 * ligaria o perfil ao nome de outra pessoa (mesma cautela de lib/seo/entidade.ts).
 */
const soLatino = (nome: string) => /^[\p{Script=Latin}\s'.-]+$/u.test(nome)

const semOo = (nome: string) => nome.replace(/oo/g, 'u')
const semHifen = (nome: string) => nome.replace(/-/g, '')
const invertida = (nome: string) => {
    const partes = nome.split(/\s+/)
    return partes.length === 2 ? `${partes[1]} ${partes[0]}` : nome
}

export function grafiasAlternativas(nome: string | undefined | null, max = 6): string[] {
    const base = (nome ?? '').trim()
    if (!base || !soLatino(base)) return []

    let formas = [base]
    for (const transformar of [semOo, semHifen, invertida]) {
        formas = [...formas, ...formas.map(transformar)]
    }

    const vistas = new Set([base.toLowerCase()])
    const saida: string[] = []
    for (const forma of formas) {
        const chave = forma.toLowerCase()
        if (vistas.has(chave)) continue
        vistas.add(chave)
        saida.push(forma)
    }
    return saida.slice(0, max)
}
