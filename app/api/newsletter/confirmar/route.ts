import { NextRequest, NextResponse } from 'next/server'
import { newsletterConfigurada, verificarToken } from '@/lib/newsletter'
import { SITE_URL } from '@/lib/constants/site'

export const dynamic = 'force-dynamic'

/** Passo 2: o link do e-mail. Token válido → contato entra na audiência do Resend. */
export async function GET(request: NextRequest) {
    const destino = (estado: string) => NextResponse.redirect(`${SITE_URL}/newsletter/confirmado?estado=${estado}`)
    if (!newsletterConfigurada()) return destino('erro')
    const email = verificarToken(request.nextUrl.searchParams.get('token') ?? '')
    if (!email) return destino('invalido')
    const resposta = await fetch(`https://api.resend.com/audiences/${process.env.RESEND_AUDIENCE_ID}/contacts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, unsubscribed: false }),
    })
    return destino(resposta.ok ? 'ok' : 'erro')
}
