import { revalidateTag } from 'next/cache'
import { after, NextRequest, NextResponse } from 'next/server'
import {
    getWPCollectionTag,
    getWPItemTag,
    isKnownWPTag,
    isWPPostType,
    normalizeWPTag,
    WP_CACHE_TAGS,
    type WPPostType,
} from '@/lib/wordpress/cache'
import { clientIpOrUnknown } from '@/lib/http/clientIp'
import { buildIndexNowUrl, buildLocalizedIndexNowUrls, INDEXNOW_LOCALIZED_TYPES, submitToIndexNow } from '@/lib/seo/indexnow'
import { wpBuscarOpcional, buildParams } from '@/lib/wordpress/client'
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/config'

/**
 * Perfil de `cacheLife` exigido pelo `revalidateTag` a partir do Next 16.
 *
 * No Next 15 a chamada era `revalidateTag(tag)`. No 16 a assinatura passou a
 * pedir um segundo argumento. A quebra e de TIPO, nao de runtime: chamar com um
 * argumento so ainda funciona e apenas emite aviso de depreciacao — e o texto
 * desse aviso, dentro do proprio Next, e que indica o substituto:
 *
 *   '"revalidateTag" without the second argument is now deprecated, add second
 *    argument of "max" or use "updateTag"'
 *
 * `updateTag` nao serve aqui: ele lanca excecao fora de Server Action, e este
 * arquivo e um route handler (o proprio Next diz, no erro E872, para usar
 * `revalidateTag` neste contexto).
 *
 * Fica em UMA constante de proposito. A semantica do perfil so entra em jogo de
 * verdade com `cacheComponents: true`, que este projeto nao liga (e `false` por
 * padrao no Next 16), entao a escolha e a que o Next apresenta como equivalente
 * da chamada antiga — mas se a invalidacao sob demanda mostrar atraso em
 * producao, o conserto e trocar esta linha, nao caçar quatro pontos de chamada.
 *
 * Este e o unico ponto do projeto onde conteudo publicado no WordPress vira
 * pagina nova para o visitante, entao foi exercitado, nao lido.
 *
 * ── O que esta provado (2026-09-12, `next start` local) ────────────────────
 *
 *   sem secret / secret errado        401, registrado como tentativa invalida
 *   ?tag=productions                  {"revalidated":true,"tags":["productions"]}
 *   payload {type,slug}               tags=[productions, production-<slug>]
 *
 * Zero aviso ou erro no log do servidor — `'max'` e perfil valido e a chamada
 * nova nao lanca nem emite nota de depreciacao. Era esse o risco do upgrade:
 * segundo argumento errado derrubaria a rota inteira.
 *
 * ── O que NAO esta provado ────────────────────────────────────────────────
 *
 * Que a purga resulta em conteudo fresco de fato. Isso depende de WordPress
 * real, trafego real e do ISR por cima, e so se verifica em producao do jeito
 * mais simples: publicar algo e ver se aparece. Se atrasar, o conserto e trocar
 * a constante acima — uma linha, nao quatro pontos de chamada.
 */
const PERFIL_PURGA = 'max'

/**
 * Avisa o IndexNow depois de responder ao WordPress. O `after` garante que a
 * chamada externa não entra no tempo do webhook — o plugin do WP tem timeout
 * curto e já derrubou revalidação por esperar rede alheia. Falha aqui é
 * registrada e ignorada: indexação é acessório, invalidar cache não é.
 */
/**
 * Idiomas com tradução publicada, lidos sem cache logo após a purga. Só
 * consulta quando há idioma além do português ativo — hoje, nenhuma chamada.
 */
async function idiomasPublicados(type: WPPostType, slug: string): Promise<string[]> {
    if (!INDEXNOW_LOCALIZED_TYPES.includes(type) || !ACTIVE_LOCALES.some((locale) => locale !== DEFAULT_LOCALE)) return []
    const itens = await wpBuscarOpcional<Array<{ translations?: Record<string, unknown> | null }>>(
        `/wp/v2/${type}${buildParams({ slug, status: 'publish', _fields: 'translations' })}`,
        { revalidate: 0 },
    )
    return Object.keys(itens[0]?.translations ?? {})
}

function avisarIndexNow(type: WPPostType, slug: unknown): void {
    if (typeof slug !== 'string' || slug.length === 0) return
    const url = buildIndexNowUrl(type, slug)
    if (!url) return

    after(async () => {
        // submitToIndexNow é escrito para não lançar, mas isto roda fora do
        // ciclo da requisição: uma rejeição escapando aqui vira unhandled
        // rejection no processo do servidor, não um 500 visível.
        try {
            const urls = [url, ...buildLocalizedIndexNowUrls(type, slug, await idiomasPublicados(type, slug))]
            const desfecho = await submitToIndexNow(urls)
            if (desfecho.ok) {
                console.log(`[indexnow] ok — ${desfecho.submitted.join(', ')} status=${desfecho.status}`)
            } else if (desfecho.reason !== 'disabled' && desfecho.reason !== 'no-valid-urls') {
                console.warn(`[indexnow] falhou — url=${url} motivo=${desfecho.reason} ${desfecho.status ?? desfecho.detail ?? ''}`)
            }
        } catch (erro) {
            console.warn(`[indexnow] exceção inesperada — url=${url} ${erro instanceof Error ? erro.message : String(erro)}`)
        }
    })
}

// Antes daqui saíam sempre posts + productions + artists + trending +
// site-settings em toda chamada: publicar uma comida derrubava o cache do site
// inteiro, inclusive o layout. Agora vai a coleção do tipo e o que deriva dela.
const DERIVED_TAGS: Partial<Record<WPPostType, string[]>> = {
    artist: [WP_CACHE_TAGS.trendingArtists],
    group: [WP_CACHE_TAGS.trendingGroups],
}

/** Quebra de linha em valor vindo do webhook falsifica linha de log. */
const forLog = (value: unknown) => String(value ?? '—').replace(/[\r\n]+/g, ' ').slice(0, 120)

// Chamado pelo WordPress via WP Webhooks plugin quando conteúdo é publicado/atualizado
// Payload: { type, slug } — secret via query param ?secret=...
// type: 'post' | 'production' | 'artist' | 'group' | 'agency' | 'food' | 'company' | 'music_release'
export async function POST(req: NextRequest) {
    const start = Date.now()
    const ip = clientIpOrUnknown(req.headers)
    const secret = req.nextUrl.searchParams.get('secret')

    // !process.env.REVALIDATE_SECRET cobre o caso da env var vir vazia/não
    // configurada — sem isso, um secret configurado como '' aceitaria
    // ?secret= (vazio) como válido, igual ao bug já corrigido em
    // reset-wp-password (removido em 2026-07-04).
    if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
        console.warn(`[revalidate] 401 tentativa inválida — ip=${ip}`)
        return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    // Os botões "Revalidar cache" do admin do WP chamam ?tag=<tag> com POST sem
    // corpo (ver oc_revalidate_* em plugin de CPTs do WordPress). Antes disso cair aqui,
    // o req.json() estourava e a rota devolvia 400 — o admin dizia "revalidado" e
    // nada era invalidado.
    const requestedTag = req.nextUrl.searchParams.get('tag')
    if (requestedTag) {
        const tags = requestedTag.split(',').map(t => normalizeWPTag(t.trim())).filter(Boolean)
        const unknown = tags.filter(tag => !isKnownWPTag(tag))
        if (tags.length === 0 || unknown.length > 0) {
            console.error(`[revalidate] tag desconhecida: ${unknown.join(', ') || '—'}`)
            return NextResponse.json({ error: 'Invalid tag', received: unknown }, { status: 400 })
        }
        for (const tag of tags) revalidateTag(tag, PERFIL_PURGA)
        const ms = Date.now() - start
        console.log(`[revalidate] ok — tags=[${tags.join(', ')}] ${ms}ms ip=${ip}`)
        return NextResponse.json({ revalidated: true, tags, ms })
    }

    let body: { type?: unknown; slug?: unknown; title?: unknown }
    try {
        body = await req.json()
    } catch {
        console.error('[revalidate] body inválido — não é JSON')
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const { type, slug, title } = body

    // store_product: revalida só a loja e encerra
    if (type === 'store_product') {
        revalidateTag(WP_CACHE_TAGS.storeProducts, PERFIL_PURGA)
        const ms = Date.now() - start
        console.log(`[revalidate] ok — type=store_product tags=[${WP_CACHE_TAGS.storeProducts}] ${ms}ms ip=${ip}`)
        return NextResponse.json({ revalidated: true, type, tags: [WP_CACHE_TAGS.storeProducts], ms })
    }

    if (type === 'monetization') {
        revalidateTag(WP_CACHE_TAGS.monetization, PERFIL_PURGA)
        const ms = Date.now() - start
        console.log(`[revalidate] ok — type=monetization tags=[${WP_CACHE_TAGS.monetization}] ${ms}ms ip=${ip}`)
        return NextResponse.json({ revalidated: true, type, tags: [WP_CACHE_TAGS.monetization], ms })
    }

    if (!isWPPostType(type)) {
        console.error(`[revalidate] tipo desconhecido: "${String(type)}"`)
        return NextResponse.json({ error: 'Invalid content type', received: type }, { status: 400 })
    }

    const tags: string[] = [
        getWPCollectionTag(type),
        ...(DERIVED_TAGS[type] ?? []),
    ]

    if (typeof slug === 'string' && slug.length > 0) {
        tags.push(getWPItemTag(type, slug))
    }

    for (const tag of tags) revalidateTag(tag, PERFIL_PURGA)
    avisarIndexNow(type, slug)

    const ms = Date.now() - start
    console.log(
        `[revalidate] ok — type=${type} slug=${forLog(slug)} title="${forLog(title)}" tags=[${tags.join(', ')}] ${ms}ms ip=${ip}`,
    )

    return NextResponse.json({ revalidated: true, type, slug, tags, ms })
}
