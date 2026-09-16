import { intlLocale } from '@/lib/i18n/format'
import { WordPressIndisponivelError } from './client'
import { slugify } from '@/lib/utils'
import { getAllGroups } from './groups'
import type { WPGroup } from './types'

export type Fandom = {
    slug: string
    name: string
    color: string | null
    lightstick: string | null
    groups: WPGroup[]
}

function normalizeKey(fandomName: string): string {
    return fandomName.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export async function getAllFandoms(): Promise<Fandom[]> {
    const groups = await getAllGroups({})
    const byKey = new Map<string, { names: Map<string, number>; groups: WPGroup[] }>()

    for (const group of groups) {
        const fandomName = group.acf?.fandom_name?.trim()
        if (!fandomName) continue
        const key = normalizeKey(fandomName)
        if (!byKey.has(key)) byKey.set(key, { names: new Map(), groups: [] })
        const entry = byKey.get(key)!
        entry.names.set(fandomName, (entry.names.get(fandomName) ?? 0) + 1)
        entry.groups.push(group)
    }

    return Array.from(byKey.values()).map(({ names, groups: fandomGroups }) => {
        const name = Array.from(names.entries()).sort((a, b) => b[1] - a[1])[0][0]
        const color = fandomGroups.find(g => g.acf?.color)?.acf?.color ?? null
        const lightstick = fandomGroups.find(g => g.acf?.lightstick)?.acf?.lightstick ?? null
        return { slug: slugify(name), name, color, lightstick, groups: fandomGroups }
    })
    // Ordem alfabética. A listagem saía na ordem de inserção do WP, então 155
    // fandoms apareciam sem critério nenhum — não dava para varrer a página
    // procurando um nome, que é a única coisa que se faz num diretório.
    .sort((a, b) => a.name.localeCompare(b.name, intlLocale(), { sensitivity: 'base' }))
}

export async function getFandomBySlug(slug: string): Promise<Fandom | null> {
    const fandoms = await getAllFandoms()
    // Lista vazia aqui nao e estado real: o site tem centenas de grupos, e
    // fandom deriva deles. Vazio significa que o WordPress nao respondeu — e a
    // pagina, ao receber null, chamaria notFound() e devolveria 404 numa pagina
    // que existe. Errar para 500 e recuperavel; errar para 404 desindexa.
    if (!fandoms.length) throw new WordPressIndisponivelError('/fandoms (lista vazia)')
    return fandoms.find(f => f.slug === slug) ?? null
}
