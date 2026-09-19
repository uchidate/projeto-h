// Subpath `/config`, nao a raiz: importar `withSentryConfig` do pacote principal
// esta deprecado desde o @sentry/nextjs 10 e para de funcionar no v11. O aviso
// saia duas vezes em cada build — uma por processo que carrega este arquivo.
import { withSentryConfig } from '@sentry/nextjs/config'
import createNextIntlPlugin from 'next-intl/plugin'
import { SECURITY_HEADERS } from './lib/security/headers.mjs'
import { SITE_DOMAIN, WORDPRESS_HOST, UMAMI_ORIGIN, identidadeFaltando } from './lib/constants/identidade.mjs'

// Build de producao sem a identidade do site configurada publicaria nome e
// dominio de exemplo. Aborta aqui, antes de compilar. Ver identidade.mjs.
if (process.env.NODE_ENV === 'production' && process.env.IDENTIDADE_PERMITE_PADRAO !== '1') {
    const faltando = identidadeFaltando()
    if (faltando.length > 0) {
        throw new Error(`Identidade do site ausente no build: ${faltando.join(', ')}`)
    }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // Proteção de descompasso de versão. Página aberta no build antigo que
    // navega depois de um deploy mandava o estado do roteador no formato velho
    // e o servidor novo respondia 500 ("The router state header was sent but
    // could not be parsed" — PHP-28, 10 eventos minutos após cada deploy). Com
    // um id por build, o Next detecta a troca e faz navegação completa.
    //
    // O id é o hash da ÁRVORE (scripts/lib/artefato.sh), o mesmo da release do
    // Sentry: build de conteúdo idêntico reaproveita a imagem e mantém o id.
    deploymentId: process.env.NEXT_DEPLOYMENT_ID || process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
    poweredByHeader: false,
    // Nao existe mais bloco `eslint` aqui: o Next 16 removeu a opcao e passou a
    // avisar "Unrecognized key(s) in object: 'eslint'" a cada build. O build
    // simplesmente nao roda mais ESLint, entao o antigo `ignoreDuringBuilds`
    // deixou de ter o que desligar.
    //
    // O lint continua onde sempre esteve de fato: `npm run lint` no quality.yml e
    // no gate do deploy. A razao original do flag (ESLint 9 + eslint-config-next
    // gerando JSON circular durante o build) ficou obsoleta junto com a opcao.
    experimental: {
        staleTimes: {
            dynamic: 0,
            static: 3600,
        },
        webpackBuildWorker: true,
        // `inlineCss` desligado em 2026-09-14 (ligado no #50 um dia antes).
        // O CSS do Tailwind tem 231KB sem compressão e o Next o embute não só no
        // <style> do HTML, mas também no payload RSC — HTML (2x), `.rsc` e
        // segmentos. Medido na imagem de produção: 3.568 arquivos pré-renderizados
        // carregavam a mesma cópia, ~800MB dos 1,4GB de `.next/server/app`
        // (imagem de 1,89GB). E como vai no RSC, cada navegação interna e cada
        // prefetch de link rebaixava o CSS, que com <link> fica em cache.
        // O ganho era só remover ~30KB (gzip) bloqueantes na primeira visita.
        // 404 com o site em volta para URL sem rota — ver app/global-not-found.tsx.
        globalNotFound: true,
    },
    images: {
        minimumCacheTTL: 31536000, // 1 ano — imagens WP são imutáveis por URL
        remotePatterns: [
            // WordPress media servido pelo mesmo domínio
            {
                protocol: 'https',
                hostname: SITE_DOMAIN,
                pathname: '/wp-content/uploads/**',
            },
            // Imagens antigas com URL ja gravada no banco apontando pro dominio
            // anterior (guid/featured_image_url historicos) — mantido durante
            // a transicao para nao quebrar posts existentes.
            {
                protocol: 'https',
                hostname: WORDPRESS_HOST.replace(/^www\./, ''),
                pathname: '/wp-content/uploads/**',
            },
            // CDN de imagens externas (TMDb, etc.)
            {
                protocol: 'https',
                hostname: 'image.tmdb.org',
            },
            {
                protocol: 'https',
                hostname: '**.wp.com',
            },
            {
                protocol: 'https',
                hostname: 'img.youtube.com',
            },
            {
                protocol: 'https',
                hostname: 'i.ytimg.com',
            },
            // Avatar do Google OAuth
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            // Gravatar (avatares WordPress)
            {
                protocol: 'https',
                hostname: 'secure.gravatar.com',
            },
            {
                protocol: 'https',
                hostname: 'www.gravatar.com',
            },
        ],
    },
    async rewrites() {
        // O IndexNow exige o arquivo de verificação na raiz, com o nome da
        // própria chave. O padrão é restrito ao alfabeto da especificação e a
        // 8-128 caracteres para não capturar nenhum outro .txt; e este array
        // roda depois de `public/`, então robots.txt e ads.txt continuam
        // sendo servidos como arquivos estáticos.
        return [
            {
                source: '/:key([a-zA-Z0-9-]{8,128}).txt',
                destination: '/api/indexnow/key/:key',
            },
            // Umami servido pelo proprio dominio.
            //
            // O subdominio `umami.` com `/script.js` casa com padroes de listas
            // de bloqueio (EasyPrivacy), e o visitante bloqueado simplesmente
            // nao e contado — perda silenciosa, que aparece como queda de
            // audiencia sem causa. Servido de primeira parte, sob um caminho
            // neutro, o tracker deixa de casar com essas regras.
            {
                source: '/stats/script.js',
                destination: `${UMAMI_ORIGIN}/script.js`,
            },
            {
                source: '/stats/api/send',
                destination: `${UMAMI_ORIGIN}/api/send`,
            },
        ]
    },
    async redirects() {
        return [
            // Caminho convencional; o índice dinâmico canônico permanece em
            // /sitemap-static.xml por compatibilidade com Search Console.
            { source: '/sitemap.xml', destination: '/sitemap-static.xml', permanent: true },
            // Artigo despublicado em 2026-09-15: todo o texto partia da premissa de
            // que o MEOVV era da HYBE (e comparava o grupo com ILLIT e LE SSERAFIM
            // "dentro da empresa"). O MEOVV e da The Black Label. A ficha do grupo,
            // corrigida no mesmo dia, responde as mesmas buscas com os dados certos.
            { source: '/blog/meovv-hybe-grupo-felino-meow-kpop', destination: '/groups/meovv', permanent: true },
            // Notícias duplicadas consolidadas em 2026-09-15: o pipeline publicou o
            // mesmo fato duas vezes em 24-48h. Duas páginas quase iguais competem
            // entre si e o Google tende a indexar só uma ("Descoberta, não
            // indexada"). Fica a versão mais completa e com mais impressões.
            { source: '/blog/cantora-kim-yoon-seol-de-singer-again-4-morre-aos-27-anos', destination: '/blog/morre-kim-yoon-seol-cantora-de-singer-again-4-aos-27-anos', permanent: true },
            { source: '/blog/boynextdoor-abre-primeira-turne-mundial-com-shows-em-seul', destination: '/blog/boynextdoor-esgota-pre-venda-e-abre-primeira-turne-mundial-em-seul', permanent: true },
            { source: '/blog/mr-kim-com-so-ji-sub-bate-recorde-de-audiencia-e-lidera-o-netflix-global', destination: '/blog/chief-kim-com-so-ji-sub-bate-recorde-de-audiencia-e-chega-ao-top-10-em-73-paises', permanent: true },
            { source: '/blog/nct-127-firma-parceria-com-sm-apos-recontrato-de-todos-os-membros', destination: '/blog/todos-os-sete-integrantes-do-nct-127-renovam-contrato-com-a-sm-entertainment', permanent: true },
            // Artistas duplicados mesclados em 2026-07-05 (mesmo artista, dois posts
            // no WP — slug "-2" era sempre o duplicado removido). Alguns já tinham
            // histórico real de busca no Google (ex: bona-2 com 568 impressões em
            // 28 dias) — sem redirect, viram 404 puro e perdem esse posicionamento.
            { source: '/artists/yves-loona-2', destination: '/artists/yves-loona', permanent: true },
            { source: '/artists/bona-2', destination: '/artists/bona', permanent: true },
            { source: '/artists/nana-2', destination: '/artists/nana', permanent: true },
            { source: '/artists/ryujin-2', destination: '/artists/ryujin', permanent: true },
            { source: '/artists/koo-jun-hoe-2', destination: '/artists/koo-jun-hoe', permanent: true },
            { source: '/artists/sooyoung-choi-2', destination: '/artists/sooyoung-choi', permanent: true },
            { source: '/artists/byun-jin-su-2', destination: '/artists/byun-jin-su', permanent: true },
            { source: '/artists/hyomin-2', destination: '/artists/hyomin', permanent: true },
            { source: '/artists/shin-dong-ryeok-2', destination: '/artists/shin-dong-ryeok', permanent: true },
            // Yoona (Girls' Generation) tinha duas fichas com o mesmo nome real e
            // data de nascimento: `yoona` (ligada ao grupo) e `yoona-2`, que era
            // onde estava o dossiê. O dossiê foi movido para a canônica e a
            // duplicata virou draft, com _oc_duplicata_de registrado.
            { source: '/artists/yoona-2', destination: '/artists/yoona', permanent: true },
            // Jungwoo (NCT) tinha duas fichas com a mesma data de nascimento:
            // `jungwoo` (créditos, foto, NCT DOJAEJUNG) e `jungwoo-nct` (dossiê).
            // O dossiê e o grupo NCT foram para a canônica; a duplicata vira draft.
            { source: '/artists/jungwoo-nct', destination: '/artists/jungwoo', permanent: true },
            // Lee Ji-hoon (1979): `lee-ji-hoon-2159482` duplicava `lee-ji-hoon`,
            // mesma data de nascimento; o único crédito foi movido.
            { source: '/artists/lee-ji-hoon-2159482', destination: '/artists/lee-ji-hoon', permanent: true },
            // Park Min-young tinha duas fichas: `park-min-young` (id 712, com data de
            // nascimento, imagem e bio propria) e `park-min-young-2` (id 11256), um stub
            // com a bio generica automatica. A duplicata virou draft, com _oc_duplicata_de.
            { source: '/artists/park-min-young-2', destination: '/artists/park-min-young', permanent: true },
            // Produção duplicada: "Agent Kim Reactivated" e "Manager Kim" sao a
            // mesma serie (김부장, SBS, 2026, TMDB 296206). A ficha duplicada
            // estava vazia — sem sinopse, elenco, ano ou tmdb_id — e mesmo assim
            // recebia 72 acessos por semana, dividindo com os 84 da canonica.
            // Artistas duplicados mesclados em 2026-08-30: 26 pessoas tinham duas
            // fichas cada (mesmo name_hangul e mesma data de nascimento). O padrao
            // era sempre o mesmo — um post vindo do catalogo de producoes, com
            // creditos de elenco e data em YYYYMMDD, e outro vindo da importacao de
            // idols, com sufixo de grupo no slug e data em YYYY-MM-DD. Os creditos de
            // elenco foram migrados para a canonica, os metadados ausentes copiados,
            // e a duplicata virou draft com _oc_duplicata_de registrado.
            { source: '/artists/sung-ji-min', destination: '/artists/lim-ji-min', permanent: true },
            { source: '/artists/park-jun-hyeong', destination: '/artists/hyeong-jun', permanent: true },
            { source: '/artists/jaehyuk-treasure', destination: '/artists/yoon-jae-hyuk', permanent: true },
            { source: '/artists/riwon-classy', destination: '/artists/kim-riwon', permanent: true },
            { source: '/artists/cha-ung-gi-to1', destination: '/artists/cha-woong-ki', permanent: true },
            { source: '/artists/kim-hye-bin', destination: '/artists/lee-hye-bin', permanent: true },
            { source: '/artists/kim-jin-woo-2', destination: '/artists/kim-jin-woo', permanent: true },
            { source: '/artists/kim-ji-sook-rainbow', destination: '/artists/kim-ji-sook-2047233', permanent: true },
            { source: '/artists/kim-se-jeong', destination: '/artists/kim-sejeong', permanent: true },
            { source: '/artists/park-chan-ace', destination: '/artists/kang-yu-chan', permanent: true },
            { source: '/artists/choi-jong-hyun', destination: '/artists/jr', permanent: true },
            { source: '/artists/park-jeong-hwa-exid', destination: '/artists/park-jeong-hwa-2', permanent: true },
            { source: '/artists/hong-so-yeong', destination: '/artists/hong-so-young', permanent: true },
            { source: '/artists/dawon-1875791', destination: '/artists/dawon', permanent: true },
            { source: '/artists/park-jun-q', destination: '/artists/kang-joon-kyu', permanent: true },
            { source: '/artists/han-eun-ji-everglow', destination: '/artists/han-eunji', permanent: true },
            { source: '/artists/moon-hee-joon-hot', destination: '/artists/moon-hee-joon', permanent: true },
            { source: '/artists/yoo-na-yun', destination: '/artists/kim-na-yun', permanent: true },
            { source: '/artists/kim-tae-woo-1629224', destination: '/artists/kim-tae-woo', permanent: true },
            { source: '/artists/yena', destination: '/artists/choi-ye-na', permanent: true },
            { source: '/artists/oh-seung-ah-rainbow', destination: '/artists/oh-seung-ah', permanent: true },
            { source: '/artists/kang-mi-na-gugudan', destination: '/artists/kang-mi-na', permanent: true },
            { source: '/artists/sung-ji-yeon-momoland', destination: '/artists/sung-ji-yeon-1875827', permanent: true },
            { source: '/artists/oh-ah-in', destination: '/artists/lee-ah-in', permanent: true },
            { source: '/artists/lim-na-young', destination: '/artists/im-na-young', permanent: true },
            { source: '/artists/park-si-eun-stayc', destination: '/artists/sieun', permanent: true },
            { source: '/productions/agent-kim-reactivated', destination: '/productions/manager-kim', permanent: true },
            // O TMDB devolve 'O Favor' e o slug sai do título, mas a URL indexada e que
            // recebe visita é a inglesa. Sem este redirect a página nasce certa e o
            // tráfego continua batendo em 404 — 13 sessões em 90 dias só nesta.
            { source: '/productions/the-favor', destination: '/productions/o-favor', permanent: true },
            // Já existia como in-between-seasons: o dedup por tmdb_id do importador
            // evitou criar duplicata, e o caso vira redirect em vez de página nova.
            { source: '/productions/in-between', destination: '/productions/in-between-seasons', permanent: true },
        ]
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: SECURITY_HEADERS,
            },
        ]
    },
}

// Aponta o next-intl para a configuração por requisição — ver lib/i18n/request.ts.
const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts')

export default withSentryConfig(withNextIntl(nextConfig), {
    // Organização na região da UE (o DSN é ingest.de.sentry.io): sem `sentryUrl`
    // o upload iria para sentry.io e responderia 404/401.
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT || 'php',
    sentryUrl: process.env.SENTRY_URL || 'https://de.sentry.io/',
    silent: true,
    widenClientFileUpload: true,
    // Replay/feedback saíram do cliente (ver instrumentation-client.ts) — os
    // excludes garantem que o webpack corte esses módulos do bundle mesmo
    // que alguma dependência os referencie.
    webpack: { treeshake: { removeDebugLogging: true, excludeReplayIframe: true, excludeReplayShadowDom: true, excludeReplayWorker: true } },
    // Só faz upload de source maps com o token (secret do build, ver Dockerfile).
    sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
    telemetry: false,
})
