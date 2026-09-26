import { NextRequest, NextResponse } from 'next/server'
import { searchWordPress } from '@/lib/wordpress/search'
import { populares, searchIndex } from '@/lib/search/index'
import { clientIpOrUnknown } from '@/lib/http/clientIp'
import { createRateLimiter } from '@/lib/http/rateLimit'

export const dynamic = 'force-dynamic'

// Rota pública e dinâmica. O teto protege o WordPress: só a busca REST (a consulta
// mais cara que ele serve) conta. Quem o índice em memória responde não toca o WP,
// então digitar rápido não gasta cota nem gera 429.
const limiter = createRateLimiter({ max: 30, windowMs: 60 * 1000 })

export async function GET(req: NextRequest) {
    const query = req.nextUrl.searchParams.get('q')?.trim() ?? ''
    if (query.length < 2) return NextResponse.json({ results: [] })

    const rapido = await searchIndex(query, 12)
    if (rapido && rapido.length > 0) {
        return NextResponse.json({ results: rapido }, { headers: { 'Cache-Control': 'private, max-age=30' } })
    }

    if (limiter.check(clientIpOrUnknown(req.headers))) {
        return NextResponse.json({ error: 'Muitas buscas, aguarde alguns segundos' }, { status: 429 })
    }

    const results = await searchWordPress(query, 12)

    // Busca vazia: manda o que está em alta para a tela não terminar em "nenhum resultado".
    const sugestoes = results.length === 0 ? populares(6) : undefined

    return NextResponse.json(
        { results, ...(sugestoes && sugestoes.length > 0 ? { sugestoes } : {}) },
        { headers: { 'Cache-Control': 'private, max-age=30' } },
    )
}
