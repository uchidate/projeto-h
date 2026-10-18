import {
    SITE_NAME,
    SITE_URL,
    SITE_HOST,
    SITE_DOMAIN,
    WORDPRESS_ORIGIN,
    UMAMI_WEBSITE_ID,
} from './identidade.mjs'

// Nome, dominio e origem do CMS vem de variavel de ambiente — ver identidade.mjs.
export { SITE_NAME, SITE_URL, SITE_HOST, SITE_DOMAIN, WORDPRESS_ORIGIN }
export const SITE_DESCRIPTION = 'Dramas, filmes, artistas e cultura coreana em português.'
export const WORDPRESS_API_FALLBACK = `${WORDPRESS_ORIGIN}/wp-json`
export const WORDPRESS_ADMIN_URL = `${WORDPRESS_ORIGIN}/wp-admin`
/**
 * Umami — analytics próprio, sem cookies.
 *
 * Ficou dois meses sem coletar: o script saiu do site em 2026-07-11 e o painel
 * seguiu exibindo o acervo historico congelado, o que e pior que nao ter
 * analytics — um numero velho sem aviso passa por atual.
 *
 * Aqui e nao em NEXT_PUBLIC_*: variavel publica e embutida no build, entao
 * precisaria existir durante o `next build` no servidor. O ID do site nao e
 * segredo (vai no HTML de qualquer forma), entao constante versionada e mais
 * simples e nao tem como divergir entre ambientes.
 */
export const UMAMI = {
    /** Servido pelo proprio dominio via rewrite — ver next.config.mjs. */
    src: '/stats/script.js',
    hostUrl: '/stats',
    websiteId: UMAMI_WEBSITE_ID,
    /** Restringe a coleta a estes hosts: impede que o script, se copiado para
     *  outro site, polua os dados com trafego que nao e nosso. */
    domains: `${SITE_HOST},${SITE_DOMAIN}`,
} as const

/**
 * Microsoft Clarity — gravação de sessão e mapa de calor (ver ClarityScript).
 *
 * O ID do projeto não é segredo (vai no HTML de qualquer forma), então é
 * constante versionada, como o do Umami. Vazio = o script não é montado.
 * Projeto em https://clarity.microsoft.com (ID em Settings > Overview).
 */
export const CLARITY = {
    projectId: 'xz76k07h8y',
} as const

export const GOOGLE_PREFERRED_SOURCE_URL = `https://www.google.com/preferences/source?q=${encodeURIComponent(`${SITE_URL}/`)}`

export function buildOgImageUrl(params: {
    title: string
    subtitle?: string
    image?: string
    type?: 'artist' | 'group' | 'production' | 'post' | 'agency'
}): string {
    const p = new URLSearchParams({ title: params.title })
    if (params.subtitle) p.set('subtitle', params.subtitle)
    if (params.image)    p.set('image', params.image)
    if (params.type)     p.set('type', params.type)
    return `${SITE_URL}/api/og?${p.toString()}`
}

export const OG_IMAGE = {
    url: `${SITE_URL}/opengraph-image`,
    width: 1200,
    height: 630,
}

export function baseOG(url: string) {
    return {
        siteName: SITE_NAME,
        type: 'website' as const,
        url,
        images: [OG_IMAGE],
    }
}

/**
 * Pré-visualização de link para uma página que não tem imagem própria: usa a imagem gerada
 * (`/api/og`, com o título) em vez da padrão e preenche título, descrição e URL.
 *
 * Existe porque `openGraph` definido numa página SUBSTITUI o do layout, imagem inclusa
 * (guias, privacidade e termos saíam sem imagem), e uma página sem `openGraph` herda o título e a URL
 * da home (/guias e /calendario eram compartilhados como a home).
 */
export function compartilhamento(p: { titulo: string; descricao?: string; caminho: string }) {
    const imagem = buildOgImageUrl({ title: p.titulo, subtitle: p.descricao })
    return {
        openGraph: {
            siteName: SITE_NAME,
            type: 'website' as const,
            url: `${SITE_URL}${p.caminho}`,
            title: p.titulo,
            ...(p.descricao && { description: p.descricao }),
            images: [{ url: imagem, width: 1200, height: 630 }],
        },
        twitter: {
            card: 'summary_large_image' as const,
            title: p.titulo,
            ...(p.descricao && { description: p.descricao }),
            images: [imagem],
        },
    }
}

export function baseTwitter() {
    return {
        card: 'summary_large_image' as const,
        images: [OG_IMAGE.url],
    }
}
