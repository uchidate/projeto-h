import { NextRequest, NextResponse } from 'next/server'
import { emailValido, gerarToken, newsletterConfigurada } from '@/lib/newsletter'
import { clientIpOrUnknown } from '@/lib/http/clientIp'
import { SITE_URL } from '@/lib/constants/site'

export const dynamic = 'force-dynamic'

/** Limite simples por IP (5 pedidos por hora). Em memória: basta para uma instância e freia o abuso óbvio. */
const pedidos = new Map<string, number[]>()
function dentroDoLimite(ip: string, agora = Date.now()): boolean {
    const recentes = (pedidos.get(ip) ?? []).filter(t => agora - t < 3_600_000)
    if (recentes.length >= 5) { pedidos.set(ip, recentes); return false }
    pedidos.set(ip, [...recentes, agora])
    return true
}

/** O formulário do rodapé só aparece quando isto responde `ativa: true`. */
export function GET() {
    return NextResponse.json({ ativa: newsletterConfigurada() }, { headers: { 'cache-control': 'no-store' } })
}

/** Passo 1 (dupla confirmação): manda o e-mail com o link; o contato só entra na audiência ao clicar. */
export async function POST(request: NextRequest) {
    if (!newsletterConfigurada()) return NextResponse.json({ erro: 'indisponivel' }, { status: 503 })
    const corpo = await request.json().catch(() => null) as { email?: unknown; site?: unknown } | null
    // Campo "site" é isca para robôs: invisível para gente, então só robô o preenche.
    if (corpo?.site) return NextResponse.json({ ok: true })
    if (!emailValido(corpo?.email)) return NextResponse.json({ erro: 'email' }, { status: 400 })
    if (!dentroDoLimite(clientIpOrUnknown(request.headers))) return NextResponse.json({ erro: 'limite' }, { status: 429 })

    const token = gerarToken(corpo.email)
    if (!token) return NextResponse.json({ erro: 'indisponivel' }, { status: 503 })
    const link = `${SITE_URL}/api/newsletter/confirmar?token=${encodeURIComponent(token)}`
    const resposta = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from: 'HallyuHub <newsletter@hallyuhub.com.br>',
            to: [corpo.email.trim()],
            subject: 'Confirme seu e-mail na newsletter do HallyuHub',
            html: `<p>Oi! Falta só um passo para você receber as novidades de K-pop e K-drama do HallyuHub.</p>
<p><a href="${link}" style="display:inline-block;background:#ff2d78;color:#fff;padding:12px 20px;text-decoration:none;font-weight:bold">Confirmar meu e-mail</a></p>
<p style="color:#666;font-size:13px">O link vale por 48 horas. Se não foi você, é só ignorar este e-mail: nada será cadastrado.</p>`,
        }),
    })
    if (!resposta.ok) return NextResponse.json({ erro: 'envio' }, { status: 502 })
    return NextResponse.json({ ok: true })
}
