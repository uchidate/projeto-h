import { NextResponse } from 'next/server'
import { getIndexNowKey } from '@/lib/seo/indexnow'

/**
 * Serve o arquivo de verificação do IndexNow em `/<chave>.txt`, via rewrite
 * declarado no next.config.mjs.
 *
 * Por que uma rota e não um arquivo em `public/`: assim a chave vive só no
 * 1Password e no ambiente do container, e girá-la não exige commitar um arquivo
 * novo. A chave é pública por definição do protocolo — quem a lê só consegue
 * submeter URLs deste mesmo host —, então a comparação abaixo serve para
 * entregar o conteúdo certo, não para proteger segredo.
 *
 * O parâmetro vem pelo caminho, não pela query: `:key` na query string do
 * destino de um rewrite não é substituído (verificado ao vivo em 2026-08-08,
 * chegava literal e a rota devolvia 404 para a chave correta).
 */
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
    const configurada = getIndexNowKey()
    const { key } = await params

    // Sem chave configurada o recurso não existe: 404 é a resposta honesta, e
    // impede que o buscador registre um arquivo de verificação vazio.
    if (!configurada || key !== configurada) {
        return new NextResponse('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }

    return new NextResponse(configurada, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
            'X-Robots-Tag': 'noindex',
        },
    })
}
