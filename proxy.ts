import { NextResponse } from 'next/server'
import { withAuth } from 'next-auth/middleware'
import { producaoFoiRemovida } from '@/lib/producoes-removidas'
import { secaoFoiRemovida } from '@/lib/secoes-removidas'

const PROTECTED_PREFIXES = ['/dashboard', '/perfil', '/minhas-listas']

const proxy = withAuth(
    async function protegerRota(req) {
        // 410 para seções que saíram do site (`/news/<id>` e `/admin/…` do sistema anterior).
        if (secaoFoiRemovida(req.nextUrl.pathname)) {
            return new NextResponse(null, { status: 410 })
        }
        // 410 para produção que não volta, em qualquer idioma (`/en/productions/…`). Consulta em memória, sem I/O: este
        // proxy já rodou um fetch por requisição no passado, para uma feature
        // que nunca funcionou, e a nota abaixo registra o custo disso.
        const producao = req.nextUrl.pathname.match(/^(?:\/[a-z]{2})?\/productions\/([^/]+)\/?$/)
        if (producao && producaoFoiRemovida(decodeURIComponent(producao[1]))) {
            return new NextResponse(null, { status: 410 })
        }
        // NOTA: este proxy já teve uma checagem de redirects dinâmicos via
        // fetch em /<namespace>/redirects (plugin de redirects do WordPress)
        // em TODA requisição. Removida em 2026-07-05: o endpoint nunca esteve
        // ativo em produção (deploy-wordpress.yml nunca deployou esse arquivo),
        // então a checagem sempre dava 404 — adicionando latência de rede real a
        // toda página, pra uma feature que nunca funcionou. Se o gerenciamento de
        // redirects for retomado, `plugin de redirects do WordPress` precisa primeiro ser
        // adaptado pra mu-plugin (register_activation_hook não dispara nesse
        // modo — a tabela wp_oc_redirects nunca seria criada) e incluído no deploy.
        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl
                // Exige auth apenas nas rotas protegidas; todo o resto é público
                if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
                    return !!token
                }
                return true
            },
        },
    },
)

export default proxy

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|sitemap.*|robots.txt|api/health).*)',
    ],
}
