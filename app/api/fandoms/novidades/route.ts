import { NextRequest, NextResponse } from 'next/server'
import { getPosts } from '@/lib/wordpress/posts'
import { getFandomBySlug } from '@/lib/wordpress/fandoms'
import { getArtistsByIds } from '@/lib/wordpress/artists'
import { stripHtml } from '@/lib/utils'
import { proximasDatas } from '@/lib/fandoms/datas'
import { chaveDia } from '@/lib/quiz/dia'
import { clientIpOrUnknown } from '@/lib/http/clientIp'
import { createRateLimiter } from '@/lib/http/rateLimit'

export const dynamic = 'force-dynamic'

// Cada torcida escolhida faz consultas ao WordPress; o teto por IP impede que um script a martele.
const limiter = createRateLimiter({ max: 30, windowMs: 60 * 1000 })

/**
 * O que o painel "Sua torcida" mostra além do nome: últimos artigos e próximas datas (estreia do grupo e
 * aniversário dos membros). Aceita ?torcida=<slug do fandom>; ?grupo=<slug do grupo> continua valendo só para as novidades.
 */
export async function GET(req: NextRequest) {
    const torcida = req.nextUrl.searchParams.get('torcida')?.trim() ?? ''
    const grupo = req.nextUrl.searchParams.get('grupo')?.trim() ?? ''
    const valido = (s: string) => /^[a-z0-9-]{1,80}$/.test(s)
    if (!valido(torcida) && !valido(grupo)) return NextResponse.json({ artigos: [], datas: [] })
    if (limiter.check(clientIpOrUnknown(req.headers))) return NextResponse.json({ error: 'Muitas consultas, aguarde alguns segundos' }, { status: 429 })

    try {
        const fandom = valido(torcida) ? await getFandomBySlug(torcida) : null
        const slugs = fandom ? fandom.groups.map(g => g.slug).slice(0, 3) : [grupo]
        const listas = await Promise.all(slugs.map(s => getPosts({ mentionsType: 'group', mentionsSlug: s, perPage: 3, includeContent: false }).then(r => r.items).catch(() => [])))
        const posts = Array.from(new Map(listas.flat().map(p => [p.id, p])).values()).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)
        const artigos = posts.map(p => ({ slug: p.slug, titulo: stripHtml(p.title.rendered), foto: p.featured_image_url ?? null, data: p.date }))

        let datas: ReturnType<typeof proximasDatas> = []
        if (fandom) {
            const ids = Array.from(new Set(fandom.groups.flatMap(g => g.acf?.members ?? [])))
            const artistas = await getArtistsByIds(ids).catch(() => [])
            datas = proximasDatas(
                fandom.groups.map(g => ({ nome: stripHtml(g.title.rendered), data: g.acf?.debut_date, encerrado: g.acf?.active === false })),
                artistas.map(a => ({ nome: stripHtml(a.title.rendered), data: a.acf?.birth_date, encerrado: !!a.acf?.death_date })),
                chaveDia(),
            )
        }
        return NextResponse.json({ artigos, datas }, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } })
    } catch {
        return NextResponse.json({ artigos: [], datas: [] })
    }
}
