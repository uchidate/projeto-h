import { NextRequest, NextResponse } from 'next/server'
import { searchWordPress } from '@/lib/wordpress/search'
import { clientIpOrUnknown } from '@/lib/http/clientIp'
import { createRateLimiter } from '@/lib/http/rateLimit'

export const dynamic = 'force-dynamic'

// Rota pública e dinâmica onde cada chamada vira busca no WordPress — a consulta
// mais cara que ele serve. Teto folgado para não atrapalhar quem digita rápido
// no campo de busca, mas fecha o uso como torneira de carga.
const limiter = createRateLimiter({ max: 30, windowMs: 60 * 1000 })

export async function GET(req: NextRequest) {
    const query = req.nextUrl.searchParams.get('q')?.trim() ?? ''
    if (query.length < 2) return NextResponse.json({ results: [] })

    if (limiter.check(clientIpOrUnknown(req.headers))) {
        return NextResponse.json({ error: 'Muitas buscas, aguarde alguns segundos' }, { status: 429 })
    }

    const results = await searchWordPress(query, 12)

    return NextResponse.json(
        { results },
        { headers: { 'Cache-Control': 'private, max-age=30' } },
    )
}
