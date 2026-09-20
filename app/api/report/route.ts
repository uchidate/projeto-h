import { WP_API_NAMESPACE } from '@/lib/constants/identidade.mjs'
import { NextRequest, NextResponse } from 'next/server'
import { WP_API_URL } from '@/lib/wordpress/config'
import { clientIpOrUnknown } from '@/lib/http/clientIp'
import { createRateLimiter } from '@/lib/http/rateLimit'
import { paraLog } from '@/lib/utils/log'

const ALLOWED_TYPES = ['artist', 'group', 'production']
const ALLOWED_CATEGORIES = ['foto_errada', 'membro_errado', 'dado_incorreto', 'outro']

// Teto de abuso casual: 5 reports por IP a cada 10 minutos.
const limiter = createRateLimiter({ max: 5, windowMs: 10 * 60 * 1000 })

// Recebe reports de conteúdo do frontend e encaminha pro endpoint custom do WP
export async function POST(req: NextRequest) {
    const ip = clientIpOrUnknown(req.headers)

    if (limiter.check(ip)) {
        console.warn(`[report] rate limit excedido — ip=${paraLog(ip)}`)
        return NextResponse.json({ error: 'Muitas requisições, tente novamente mais tarde' }, { status: 429 })
    }

    let body: { target_type?: unknown; target_id?: unknown; category?: unknown; message?: unknown }
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const { target_type, target_id, category, message } = body

    if (typeof target_type !== 'string' || !ALLOWED_TYPES.includes(target_type)) {
        return NextResponse.json({ error: 'Invalid target_type' }, { status: 400 })
    }
    if (typeof target_id !== 'number' || target_id <= 0) {
        return NextResponse.json({ error: 'Invalid target_id' }, { status: 400 })
    }
    if (typeof category !== 'string' || !ALLOWED_CATEGORIES.includes(category)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    try {
        const res = await fetch(`${WP_API_URL}/${WP_API_NAMESPACE}/report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Sem repassar o IP, o WordPress enxerga só o IP deste container e
                // aplica um único balde de rate limit para o site inteiro.
                'X-Forwarded-For': ip,
            },
            signal: AbortSignal.timeout(8000),
            body: JSON.stringify({
                target_type,
                target_id,
                category,
                message: typeof message === 'string' ? message.slice(0, 1000) : '',
            }),
        })

        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
            console.warn(`[report] falhou — status=${res.status} ip=${paraLog(ip)}`, data)
            return NextResponse.json({ error: data.message ?? 'Falha ao enviar report' }, { status: res.status })
        }

        console.log(`[report] ok — type=${paraLog(String(target_type))} id=${paraLog(String(target_id))} category=${paraLog(category)} ip=${paraLog(ip)}`)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[report] erro ao contatar WordPress', error)
        return NextResponse.json({ error: 'Serviço indisponível' }, { status: 502 })
    }
}
