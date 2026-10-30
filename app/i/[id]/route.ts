import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/constants/site'
import { redirecionarSecao, SEM_INDEXAR } from '@/lib/redes/linkCurto'
import { WordPressIndisponivelError } from '@/lib/wordpress/client'
import { getPostSlugById } from '@/lib/wordpress/posts'

// Link curto das legendas do Instagram: `/i/35235` leva à matéria com a origem marcada. A legenda não torna link
// clicável, então a pessoa digita ou copia o endereço; curto (hallyuhub.com.br/i/35235) é o que dá para digitar.
// O UTM sai daqui e não do texto da legenda, e o Umami continua separando por post (`utm_campaign` = slug).
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    // Não numérico: seção do site (`/i/loja`); redirecionarSecao devolve 404 para o que não for seção.
    if (!/^\d{1,10}$/.test(id)) return redirecionarSecao([id])

    let slug: string | null
    try {
        slug = await getPostSlugById(Number(id))
    } catch (error) {
        // WordPress fora do ar não é "post inexistente": 503 não é cacheado nem lido como remoção.
        if (error instanceof WordPressIndisponivelError) {
            return new NextResponse(null, { status: 503, headers: { ...SEM_INDEXAR, 'Retry-After': '60', 'Cache-Control': 'no-store' } })
        }
        throw error
    }
    if (!slug) return new NextResponse(null, { status: 404, headers: SEM_INDEXAR })

    const destino = `${SITE_URL}/blog/${slug}?utm_source=instagram&utm_medium=social&utm_campaign=${slug}`
    return NextResponse.redirect(destino, {
        status: 302,
        headers: { ...SEM_INDEXAR, 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
}
