import { NextRequest, NextResponse } from 'next/server'
import { getConexoes, type TipoEntidade } from '@/lib/mapa/conexoes'
import { clientIpOrUnknown } from '@/lib/http/clientIp'
import { createRateLimiter } from '@/lib/http/rateLimit'

export const dynamic = 'force-dynamic'

// Cada recentragem chama o WordPress (3 a 4 consultas), então o teto é mais apertado que o da busca.
const limiter = createRateLimiter({ max: 30, windowMs: 60 * 1000 })
const TIPOS: TipoEntidade[] = ['artist', 'group', 'production']
const SLUG = /^[a-z0-9][a-z0-9-]{0,120}$/

export async function GET(req: NextRequest) {
    const tipo = req.nextUrl.searchParams.get('tipo') as TipoEntidade | null
    const slug = req.nextUrl.searchParams.get('slug') ?? ''
    if (!tipo || !TIPOS.includes(tipo) || !SLUG.test(slug)) return NextResponse.json({ error: 'parâmetros inválidos' }, { status: 400 })
    if (limiter.check(clientIpOrUnknown(req.headers))) return NextResponse.json({ error: 'Muitas consultas, aguarde' }, { status: 429 })
    try {
        const dados = await getConexoes(tipo, slug)
        if (!dados) return NextResponse.json({ error: 'não encontrado' }, { status: 404 })
        return NextResponse.json(dados, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } })
    } catch {
        return NextResponse.json({ error: 'indisponível' }, { status: 502 })
    }
}
