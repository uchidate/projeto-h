import { getTranslations } from 'next-intl/server'
import { HomePtBadge } from '@/components/home/HomePtBadge'
import { postLink } from '@/components/home/postLink'
import { href as rota } from '@/lib/i18n/routes'
import { SITE_NAME } from '@/lib/constants/site'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { intlLocale } from '@/lib/i18n/format'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Star } from 'lucide-react'
import type { WPPost, WPProduction } from '@/lib/wordpress/types'
import { getProductionBySlug } from '@/lib/wordpress/productions'
import { getArtists } from '@/lib/wordpress/artists'
import { getAvaliacao, confiancaDaNota } from '@/lib/tmdb/avaliacao'
import { getWPImage, stripHtml, formatDatePt, readingTime } from '@/lib/utils'
import { homeCatName } from '@/lib/home/catStyle'
import { HeroCarousel } from '@/components/home/HeroCarousel'

async function HeroPost({ post, locale, primeiro = true }: { post: WPPost; locale: Locale; primeiro?: boolean }) {
    const t = await getTranslations({ locale, namespace: 'home.hero' })
    const tc = await getTranslations({ locale, namespace: 'home.comum' })
    const data = formatDatePt(post.date, intlLocale(locale))
    const image = getWPImage(post._embedded, post.featured_image_url)
    const title = stripHtml(post.title.rendered)
    const excerpt = stripHtml(post.excerpt?.rendered ?? '').slice(0, 160)
    const mins = readingTime(post.content?.rendered ?? '')

    const Titulo = primeiro ? 'h1' : 'h2'

    return (
        <div>
            <Link {...postLink(post.slug, locale)}
                className="group relative block min-w-0 overflow-hidden border-b border-border">
                <div className="relative aspect-16/10 w-full sm:aspect-video">
                    {image ? (
                        <Image src={image.src} alt={image.alt || title} fill priority={primeiro} fetchPriority={primeiro ? 'high' : 'auto'}
                            sizes="(max-width: 1024px) 100vw, 46vw"
                            className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none" />
                    ) : (
                        <div className="absolute inset-0 bg-surface flex items-center justify-center">
                            <span className="font-black text-[100px] leading-none text-accent/10">한류</span>
                        </div>
                    )}
                </div>
            </Link>

            <div className="flex min-w-0 flex-col border-b border-border bg-background px-4 py-5 sm:px-6 sm:py-6 lg:px-5">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em]">
                    <span className="text-accent">{primeiro ? tc('capa') : tc('emDestaque')}</span>
                    <span className="text-muted/45" aria-hidden="true">·</span>
                    <span className="text-muted">{homeCatName(post, undefined, tc('artigo'))}</span>
                    <span className="text-muted/45" aria-hidden="true">·</span>
                    <span className="text-muted">{tc('minutosDeLeitura', { mins })}</span>
                    <HomePtBadge locale={locale} />
                </div>
                <Link {...postLink(post.slug, locale)} className="group mt-3 min-w-0">
                    {/* Variante mobile do mesmo título: como <h1>, formava par com o
                        hero desktop e o crawler (que não aplica breakpoint) via dois H1.
                        role/aria-level preserva o cabeçalho para leitor de tela. */}
                    <Titulo className="min-w-0 max-w-[22ch] wrap-anywhere font-serif text-[clamp(1.8rem,7.6vw,2.6rem)] font-medium lg:text-[2.1rem] leading-[1.03] tracking-[-0.035em] text-foreground transition-colors group-hover:text-accent">
                        {title}
                    </Titulo>
                </Link>
                {excerpt && <p className="mt-3 max-w-[58ch] text-[13px] leading-5 text-muted line-clamp-2">{excerpt}</p>}
                <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4">
                    <span className="min-w-0 truncate text-[11px] text-muted">{data}</span>
                    <Link {...postLink(post.slug, locale)}
                        className="shrink-0 whitespace-nowrap border-b border-accent pb-0.5 font-mono text-[10px] font-black uppercase tracking-widest text-foreground transition-colors hover:text-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent">
                        {`${t('lerAgora')} `}<span aria-hidden="true">→</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}

async function HeroProduction({ production, locale }: { production: WPProduction; locale: Locale }) {
    const t = await getTranslations({ locale, namespace: 'home.hero' })
    const acf = production.acf ?? {}
    const title = stripHtml(production.title.rendered)
    const imagem = acf.backdrop_url ? { src: acf.backdrop_url, alt: title } : getWPImage(production._embedded, production.featured_image_url)
    const destino = rota('production', { slug: production.slug }, locale)
    // A listagem não traz o texto; a sinopse vem da ficha (cache de 30 min). Sem ela, o painel segue sem o parágrafo.
    const [ficha, avaliacao] = await Promise.all([
        getProductionBySlug(production.slug).catch(() => null),
        getAvaliacao(acf.tmdb_id, acf.type),
    ])
    // Nota só com amostra: com poucos votos ela é a opinião de poucas pessoas (ver lib/tmdb/avaliacao.ts).
    const notaConfiavel = avaliacao && confiancaDaNota(avaliacao.votos) === 'confiavel' ? avaliacao : null
    const sinopse = stripHtml(ficha?.content?.rendered ?? '').slice(0, 220)
    // Elenco principal: até 4 artistas com ficha, na ordem do cadastro da produção.
    const slugsElenco = (ficha?.production_cast?.length ? ficha.production_cast.map(c => c.slug) : ficha?.artist_slugs ?? []).slice(0, 4)
    const artistas = slugsElenco.length
        ? await getArtists({ slug: slugsElenco.join(','), perPage: slugsElenco.length }).then(r => r.items).catch(() => [])
        : []
    const elenco = slugsElenco
        .map(slug => artistas.find(a => a.slug === slug))
        .filter((a): a is NonNullable<typeof a> => a !== undefined)
    const plataformas = (acf.platforms ?? (acf.platform ? [acf.platform] : [])).filter(Boolean).slice(0, 3)
    const trailer = !!acf.trailer_url
    const situacao = acf.status_production === 'airing' ? t('emExibicao') : acf.status_production === 'completed' ? t('concluida') : acf.status_production === 'upcoming' ? t('emBreve') : null
    const classificacao = acf.age_rating ? (acf.age_rating === 'L' ? t('classificacaoLivre') : `${acf.age_rating}+`) : null
    const meta = [acf.year, acf.genre, acf.episodes ? `${acf.episodes} ep.` : null, acf.network, situacao].filter(Boolean).join(' · ')

    // Mesma estrutura da capa de matéria (imagem à esquerda, texto ao lado): a produção
    // ocupava a largura toda, com o texto sobre a imagem, e destoava do resto da home.
    return (
        <div className="lg:flex lg:h-[400px]">
            <div className="group relative min-w-0 overflow-hidden border-b border-border lg:w-[50%] lg:shrink-0 lg:border-b-0 lg:border-r">
                <div className="relative aspect-16/10 w-full sm:aspect-video lg:h-full lg:aspect-auto">
                    {imagem ? (
                        <Image src={imagem.src} alt="" fill priority fetchPriority="high"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-surface">
                            <span className="text-[100px] font-black leading-none text-accent/10">한류</span>
                        </div>
                    )}
                    {/* A imagem inteira leva à ficha; o que fica sobre ela é informação que ajuda a decidir
                        (tipo, onde assistir, trailer) e não repete o título, que está no painel ao lado. */}
                    <Link href={destino} aria-label={title} className="absolute inset-0" />
                    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-linear-to-t from-black/90 via-black/55 to-transparent" />
                    <span className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 sm:left-4 sm:top-4">
                        <span className="bg-black/60 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                            {[acf.type === 'movie' ? t('tipoFilme') : t('tipoSerie'), acf.year].filter(Boolean).join(' · ')}
                        </span>
                        {classificacao && (
                            <span title={t('classificacaoIndicativa')} className="border border-white/60 bg-black/60 px-2 py-1 font-mono text-[10px] font-black text-white backdrop-blur-sm">{classificacao}</span>
                        )}
                    </span>
                    {trailer && (
                        <Link href={`${destino}#trailer`} aria-label={t('verTrailer', { title })}
                            className="absolute right-3 top-3 z-10 inline-flex h-11 items-center gap-2 bg-accent px-4 text-[12px] font-black uppercase tracking-[0.08em] text-[#0d0b0f] transition-colors hover:bg-accent-strong sm:right-4 sm:top-4">
                            <Play size={14} fill="currentColor" /> {t('trailer')}
                        </Link>
                    )}
                    {(plataformas.length > 0 || elenco.length > 0) && (
                        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col gap-3 sm:inset-x-4 sm:bottom-4">
                            {plataformas.length > 0 && (
                                <p className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-white/70">{t('disponivelEm')}</span>
                                    {plataformas.map(nome => (
                                        <span key={nome} className="border border-white/40 bg-black/40 px-2.5 py-1 text-[12px] font-bold text-white backdrop-blur-sm">{nome}</span>
                                    ))}
                                </p>
                            )}
                            {elenco.length > 0 && (
                                <div className="pointer-events-auto relative z-10">
                                    <p className="mb-2 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white/80">{t('elenco')}</p>
                                    <ul className="flex items-start gap-3 sm:gap-5">
                                        {elenco.map(a => {
                                            const nome = stripHtml(a.title.rendered)
                                            const foto = getWPImage(a._embedded, a.featured_image_url)
                                            return (
                                                <li key={a.id} className="w-[68px] min-w-0 sm:w-[92px]">
                                                    <Link href={rota('artist', { slug: a.slug }, locale)} title={nome} className="group/ator flex flex-col items-center gap-1.5 text-center">
                                                        <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white bg-surface shadow-[0_4px_14px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover/ator:scale-110 group-hover/ator:border-accent motion-reduce:transition-none sm:h-[68px] sm:w-[68px]">
                                                            {foto ? (
                                                                <Image src={foto.src} alt="" fill sizes="68px" className="object-cover object-top" />
                                                            ) : (
                                                                <span className="flex h-full w-full items-center justify-center text-[18px] font-black text-muted">{nome[0]}</span>
                                                            )}
                                                        </span>
                                                        <span className="line-clamp-2 w-full wrap-anywhere text-[11px] font-bold leading-tight text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.9)] transition-colors group-hover/ator:text-accent sm:text-[12px]">{nome}</span>
                                                    </Link>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col bg-background px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
                    {acf.type === 'movie' ? t('filmeEmDestaque') : t('doramaEmDestaque')}
                </p>
                <Link href={destino} className="group mt-3 min-w-0">
                    <h1 className="min-w-0 max-w-[20ch] wrap-anywhere font-serif text-[clamp(1.8rem,7.6vw,2.6rem)] font-medium leading-[1.03] tracking-[-0.035em] text-foreground transition-colors group-hover:text-accent lg:text-home-hero">
                        {title}
                    </h1>
                </Link>
                {acf.original_title && <p className="mt-2 break-keep text-[15px] font-bold text-accent">{acf.original_title}</p>}
                {meta && <p className="mt-3 text-[13px] text-muted">{meta}</p>}
                {notaConfiavel && (
                    <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-[13px]">
                        <span className="inline-flex items-center gap-1.5 font-bold text-foreground">
                            <Star size={13} className="text-amber-400" fill="currentColor" aria-hidden />
                            {notaConfiavel.nota.toFixed(1).replace('.', ',')}<span className="font-normal text-muted">/10</span>
                        </span>
                        <span className="font-mono text-[11px] text-muted">{t('notaVotos', { count: notaConfiavel.votos })}</span>
                    </p>
                )}
                {sinopse && <p className="mt-4 max-w-[52ch] text-[14px] leading-[1.65] text-foreground/65 line-clamp-4 lg:line-clamp-3 lg:text-[15px]">{sinopse}</p>}
                <div className="mt-auto flex items-center justify-end border-t border-border pt-4 lg:pt-5">
                    <Link href={destino}
                        className="inline-flex shrink-0 items-center gap-2 bg-accent-a11y px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:bg-accent-a11y/90">
                        {`${t('verProducao')} `}<span aria-hidden>→</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}

async function HeroFallback({ locale }: { locale: Locale }) {
    const t = await getTranslations({ locale, namespace: 'home.hero' })
    return (
        <div className="grid min-h-[360px] border-b border-border lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col justify-center px-4 py-12 sm:px-8 lg:px-10">
                <p className="font-mono text-home-label font-black uppercase text-accent">{t('fallbackEyebrow')}</p>
                <h1 className="mt-3 max-w-[12ch] text-home-hero-xl font-black text-foreground">
                    {t('fallbackTitulo')}
                </h1>
                <div className="mt-7 flex flex-wrap gap-2">
                    <Link href={rota('blog', undefined, locale)} className="bg-accent-a11y px-4 py-2 text-[12px] font-black uppercase tracking-[0.12em] text-white">{t('verArtigos')}</Link>
                    <Link href={rota('artists', undefined, locale)} className="border border-foreground px-4 py-2 text-[12px] font-black uppercase tracking-[0.12em]">{t('artistas')}</Link>
                </div>
            </div>
            <div className="relative hidden overflow-hidden border-l border-border bg-foreground text-background lg:block">
                <span className="absolute -right-10 top-4 text-[180px] font-black leading-none tracking-[-0.12em] text-white/[0.07]">한류</span>
                <div className="relative flex h-full flex-col justify-end p-10">
                    <p className="font-mono text-home-label font-black uppercase text-accent">{SITE_NAME}</p>
                    <p className="mt-3 max-w-[28ch] text-home-title-lg font-black leading-[1.1]">
                        {t('fallbackSubtitulo')}
                    </p>
                </div>
            </div>
        </div>
    )
}

interface Props {
    /** Matérias do carrossel: a capa primeiro. Uma só vira o card único. */
    posts?: WPPost[]
    production?: WPProduction
    locale?: Locale
}

export function HomeHero({ posts = [], production, locale = DEFAULT_LOCALE }: Props) {
    if (posts.length === 1) return <HeroPost post={posts[0]} locale={locale} />
    if (posts.length > 1) {
        return (
            <HeroCarousel>
                {posts.map((post, i) => <HeroPost key={post.id} post={post} locale={locale} primeiro={i === 0} />)}
            </HeroCarousel>
        )
    }
    if (production) return <HeroProduction production={production} locale={locale} />
    return <HeroFallback locale={locale} />
}
