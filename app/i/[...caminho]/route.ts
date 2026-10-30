import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/constants/site'

export const dynamic = 'force-dynamic'

const SEM_INDEXAR = { 'X-Robots-Tag': 'noindex, nofollow' }

/** Primeiro trecho aceito: fichas e seções do site. Lista fechada, para o link curto nunca virar redirecionador aberto. */
const SECOES = new Set([
    'artists', 'groups', 'productions', 'empresas', 'comidas', 'agencies', 'guias',
    'fandoms', 'calendario', 'quiz', 'loja', 'blog', 'cultura-coreana-101',
])
const TRECHO = /^[a-z0-9][a-z0-9._-]{0,120}$/i

/**
 * Link curto das redes para fichas e seções: `/i/artists/iu` leva a `/artists/iu`, `/i/loja` a `/loja`.
 * (Artigos usam `/i/{id}`, em `app/i/[id]`.) O destino não é consultado no WordPress: se a ficha não existir,
 * a própria página responde 404. A campanha é o caminho sem barra inicial, igual ao que o painel de redes mede.
 */
export async function GET(_request: Request, context: { params: Promise<{ caminho: string[] }> }) {
    const { caminho } = await context.params
    const trechos = caminho.map(t => decodeURIComponent(t))
    if (trechos.length > 2 || !SECOES.has(trechos[0]) || !trechos.every(t => TRECHO.test(t))) {
        return new NextResponse(null, { status: 404, headers: SEM_INDEXAR })
    }
    const rota = trechos.join('/')
    const destino = `${SITE_URL}/${rota}?utm_source=instagram&utm_medium=social&utm_campaign=${encodeURIComponent(rota)}`
    return NextResponse.redirect(destino, {
        status: 302,
        headers: { ...SEM_INDEXAR, 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
}
