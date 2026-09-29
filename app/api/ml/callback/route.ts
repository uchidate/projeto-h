import { NextRequest, NextResponse } from 'next/server'

/**
 * Callback do OAuth do Mercado Livre (redirect_uri cadastrado no app,
 * item "Mercado Livre API" no 1Password). Só exibe o `code` recebido para
 * troca manual por token — a troca em si roda offline, via script que lê o
 * App Secret do 1Password, nunca guardado neste servidor.
 */
export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get('code')
    const error = request.nextUrl.searchParams.get('error')

    if (error) {
        return new NextResponse(`Autorização recusada: ${error}`, { status: 400 })
    }
    if (!code) {
        return new NextResponse('Nenhum "code" recebido.', { status: 400 })
    }

    return new NextResponse(
        `Autorização concluída.\n\ncode: ${code}\n\nCopie esse valor e use no script de troca de token (expira em minutos).`,
        { headers: { 'content-type': 'text/plain; charset=utf-8' } },
    )
}
