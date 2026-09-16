import { NextRequest, NextResponse } from 'next/server'
import { WP_API_URL } from '@/lib/wordpress/config'
import { getWpToken } from '@/lib/auth/wpToken'

export const dynamic = 'force-dynamic'

/**
 * Proxy da API de usuário do WordPress.
 *
 * O browser não conhece mais o token: ele chama /api/user/* com o cookie de
 * sessão e é este handler, no servidor, que carimba o X-OC-Token. Antes o token
 * ia para o cliente dentro da sessão do NextAuth, e qualquer XSS no site virava
 * takeover da conta no WP.
 */
// Todos os endpoints da área logada ficam sob /oc/v1/user/.
const ALLOWED_PREFIX = 'user/'

async function proxy(req: NextRequest, path: string[]) {
    const target = path.join('/')
    // Allowlist: o proxy fala com a área de usuário, não com o WP inteiro.
    if (!target.startsWith(ALLOWED_PREFIX)) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const token = await getWpToken()
    if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const search = req.nextUrl.search
    const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text()

    try {
        const res = await fetch(`${WP_API_URL}/oc/v1/${target}${search}`, {
            method: req.method,
            headers: { 'Content-Type': 'application/json', 'X-OC-Token': token },
            body,
            cache: 'no-store',
            signal: AbortSignal.timeout(8000),
        })
        const text = await res.text()
        return new NextResponse(text, {
            status: res.status,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        })
    } catch (error) {
        console.error(`[user-proxy] falhou — ${target}`, error)
        return NextResponse.json({ error: 'Serviço indisponível' }, { status: 502 })
    }
}

type Context = { params: Promise<{ path: string[] }> }

export async function GET(req: NextRequest, ctx: Context) {
    return proxy(req, (await ctx.params).path)
}
export async function POST(req: NextRequest, ctx: Context) {
    return proxy(req, (await ctx.params).path)
}
export async function PUT(req: NextRequest, ctx: Context) {
    return proxy(req, (await ctx.params).path)
}
export async function DELETE(req: NextRequest, ctx: Context) {
    return proxy(req, (await ctx.params).path)
}
