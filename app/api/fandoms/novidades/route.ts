import { NextRequest, NextResponse } from 'next/server'
import { getPosts } from '@/lib/wordpress/posts'
import { stripHtml } from '@/lib/utils'
import { clientIpOrUnknown } from '@/lib/http/clientIp'
import { createRateLimiter } from '@/lib/http/rateLimit'

export const dynamic = 'force-dynamic'

// Cada torcida escolhida faz uma consulta ao WordPress; o teto por IP impede que um script a martele.
const limiter = createRateLimiter({ max: 30, windowMs: 60 * 1000 })

/** Últimos artigos que citam o grupo, para o painel "Sua torcida" do espaço do fã. */
export async function GET(req: NextRequest) {
    const grupo = req.nextUrl.searchParams.get('grupo')?.trim() ?? ''
    if (!/^[a-z0-9-]{1,80}$/.test(grupo)) return NextResponse.json({ artigos: [] })
    if (limiter.check(clientIpOrUnknown(req.headers))) return NextResponse.json({ error: 'Muitas consultas, aguarde alguns segundos' }, { status: 429 })

    try {
        const { items } = await getPosts({ mentionsType: 'group', mentionsSlug: grupo, perPage: 3, includeContent: false })
        const artigos = items.map(p => ({ slug: p.slug, titulo: stripHtml(p.title.rendered), foto: p.featured_image_url ?? null, data: p.date }))
        return NextResponse.json({ artigos }, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } })
    } catch {
        return NextResponse.json({ artigos: [] })
    }
}
