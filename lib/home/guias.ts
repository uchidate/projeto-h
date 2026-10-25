import { getHub } from '@/lib/guias'
import { getHubItems } from '@/lib/guias/hub-items'

/** Guias por tema da faixa escura: slug do guia em /guias/{slug} e a cor do filete. */
export const GUIAS_POR_TEMA = [
    { slug: 'melhores-doramas-de-todos-os-tempos', cor: '#6d3fc0' },
    { slug: 'doramas-romanticos', cor: '#c0307a' },
    { slug: 'doramas-acao-coreanos', cor: '#b4531a' },
    { slug: 'filmes-coreanos', cor: '#1a5fb4' },
    { slug: 'doramas-coreanos-netflix', cor: '#c61153' },
    { slug: 'doramas-historicos-coreanos', cor: '#0b6b63' },
] as const

export interface GuiaDaHome {
    slug: string
    titulo: string
    cor: string
    total: number
    /** Até três capas, sem repetir entre guias. */
    capas: string[]
}

/** Texto de apoio de cada passo do "Comece aqui", por rótulo; passo sem entrada aqui fica só com o título. */
export const APOIO_DOS_PASSOS: Record<string, string> = {
    'O que é Hallyu?': 'a onda coreana, em poucos minutos',
    'Como começar no K-Pop': 'por onde ouvir primeiro',
    'Idol vs. Artist': 'quem é quem',
    'Posições em um grupo de K-Pop': 'líder, vocal, rapper',
    'Line no K-pop (vocal/dance/maknae)': 'vocal, dance, maknae',
    'Hangeul em 30 minutos': 'leia o alfabeto coreano',
}

/** Três capas por guia, escolhendo as que ainda não apareceram em outro guia (os temas se sobrepõem). */
export function escolherCapas(porGuia: { slug: string; capas: string[] }[], n = 3): Record<string, string[]> {
    const usadas = new Set<string>()
    const out: Record<string, string[]> = {}
    for (const { slug, capas } of porGuia) {
        const novas = capas.filter(c => !usadas.has(c))
        const escolhidas = [...novas, ...capas.filter(c => !novas.includes(c))].slice(0, n)
        escolhidas.forEach(c => usadas.add(c))
        out[slug] = escolhidas
    }
    return out
}

export async function carregarGuiasPorTema(): Promise<GuiaDaHome[]> {
    const lidos = await Promise.all(GUIAS_POR_TEMA.map(async ({ slug, cor }) => {
        const hub = await getHub(slug)
        if (!hub || hub.kind !== 'productions') return null
        const r = await getHubItems(hub, { perPage: 8 })
        if (r.kind !== 'productions') return null
        // Transmissões de show no cinema ("Live Viewing") entram como filme, mas não são o que o guia promete.
        const capas = r.items.filter(p => !/live viewing/i.test(p.title.rendered)).map(p => p.featured_image_url).filter((c): c is string => !!c)
        return { slug, titulo: hub.shortTitle || hub.title, cor, total: r.total, capas }
    }))
    const guias = lidos.filter((g): g is NonNullable<typeof g> => g !== null && g.capas.length > 0)
    const capas = escolherCapas(guias)
    return guias.map(g => ({ slug: g.slug, titulo: g.titulo, cor: g.cor, total: g.total, capas: capas[g.slug] }))
}
