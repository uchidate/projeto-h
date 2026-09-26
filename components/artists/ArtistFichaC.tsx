import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ADSENSE } from '@/lib/config/ads'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ContentStateButton } from '@/components/features/ContentStateButton'
import { CollapsibleProse } from '@/components/profiles/CollapsibleProse'
import { highlightProse } from '@/lib/profiles/highlightProse'
import { formatDate, getWPImage, stripHtml } from '@/lib/utils'
import { intlLocale } from '@/lib/i18n/format'
import type { WPAgency, WPArtist, WPGroup, WPPost, WPProduction } from '@/lib/wordpress/types'
import type { ArtistProfileModel } from '@/lib/profiles/artistProfile'
import { GroupMVPlayer } from '@/components/groups/GroupMVPlayer'
import { GroupDiscography, type DiscographyAlbum } from '@/components/groups/GroupDiscography'
import { GroupSpotifyEmbed } from '@/components/groups/GroupSpotifyEmbed'
import { ArtistCarreira } from '@/components/artists/ArtistCarreira'
import { ArtistAtalhos } from '@/components/artists/ArtistAtalhos'

interface Props {
    artist: WPArtist
    name: string
    image: { src: string; alt?: string } | null
    roleLabels: string[]
    groups: WPGroup[]
    agency?: WPAgency
    productions: WPProduction[]
    relatedPosts: WPPost[]
    relatedArtists: WPArtist[]
    discography: DiscographyAlbum[]
    model: ArtistProfileModel
    magra: boolean
    /** Blocos originais já renderizados, por id: entram como estão onde a ficha C não tem versão própria. */
    nodes: Record<string, ReactNode>
    /** Blocos sem lugar na ficha C; ficam recolhidos, mas no HTML. */
    resto: ReactNode[]
    titulos: { dossier: string; story: string; awards: string }
}

const anoDe = (p: WPProduction) => p.acf?.year ?? (parseInt((p.acf?.release_date ?? p.date ?? '').slice(0, 4)) || 0)
const nota = (p: WPProduction) => p.acf?.rating ?? 0
const anosDoPeriodo = (periodo: string) => (periodo.match(/\d{4}/g) ?? []).map(Number)

// A proposta usa o rosa da marca em toda ficha, não a cor de destaque de cada artista.
const ROSA = 'var(--color-accent)'
const KICKER = 'font-mono text-[11px] font-black uppercase tracking-[0.14em]'
const SERIF = 'font-[family-name:var(--font-playfair)]'
const H2 = `${SERIF} text-[28px] font-bold leading-[1.05] sm:text-[38px]`
const COL = 'page-wrap'
const BOTAO = 'touch-target mt-6 inline-flex h-11 items-center border px-5 text-[14px] font-bold hover:bg-accent/10'

function Sec({ id, kicker, title, children, className = '' }: { id?: string; kicker: string; title: string; children: ReactNode; className?: string }) {
    return (
        <section id={id} className={`scroll-mt-28 border-t border-border py-12 sm:py-[72px] ${className}`}>
            <div className={COL}>
                <p className={`${KICKER} text-muted`}>{kicker}</p>
                <h2 className={`mt-2 ${H2}`}>{title}</h2>
                <div className="mt-6 sm:mt-8">{children}</div>
            </div>
        </section>
    )
}

function Anuncio({ placement, layout = 'content' }: { placement: string; layout?: 'content' | 'leaderboard' }) {
    const slot = layout === 'leaderboard' ? ADSENSE.slots.leaderboard : ADSENSE.slots.inline
    if (!slot) return null
    return <div className={`${COL} py-4`}><AdSlotInline slot={slot} layout={layout} analyticsPlacement={placement} /></div>
}

/** Reparte os capítulos em até três fases seguidas, com tamanhos o mais parecidos possível. */
function fasesDe<T>(itens: T[]): T[][] {
    const n = Math.min(3, itens.length)
    const fases: T[][] = []
    let inicio = 0
    for (let i = 0; i < n; i++) {
        const tamanho = Math.ceil((itens.length - inicio) / (n - i))
        fases.push(itens.slice(inicio, inicio + tamanho))
        inicio += tamanho
    }
    return fases
}

/**
 * Ficha C, seguindo a proposta "Página de artista v2" (Jisoo): topo com ações, abas, atalhos por intenção,
 * visão geral curta, carreira em fases, música, obras, universo e leitura. O que a proposta não mostra
 * (análise, redes, hall da fama etc.) fica recolhido em "Ficha completa", no mesmo HTML.
 */
export function ArtistFichaC({
    artist, name, image, roleLabels, groups, agency, productions, relatedPosts, relatedArtists, discography,
    model, magra, nodes, resto, titulos,
}: Props) {
    const accent = ROSA
    const locale = useLocale()
    const t = useTranslations('profile.artistC')
    const tp = useTranslations('profile')
    const acf = artist.acf ?? {}
    const grupo = groups[0]
    const nomeGrupo = grupo ? stripHtml(grupo.title?.rendered ?? '') : null
    const nomeAgencia = agency ? stripHtml(agency.title?.rendered ?? '') : null
    const { storyChapters, awards, keyMetrics, careerStatement, contentBefore, contentAfter } = model
    const semAnuncio = magra

    const videos = model.videoList
    const spotify = acf.spotify ? String(acf.spotify) : ''
    const temMusica = videos.length > 0 || discography.length > 0 || !!spotify

    const comPoster = productions.map(p => ({ p, img: getWPImage(p._embedded, p.featured_image_url) })).filter(x => x.img)
    const destaques = [...comPoster].sort((a, b) => nota(b.p) - nota(a.p) || anoDe(b.p) - anoDe(a.p)).slice(0, 3)
    const tituloDe = (p: WPProduction) => stripHtml(p.title?.rendered ?? '')

    const fases = fasesDe(storyChapters).map(cap => {
        const anos = cap.flatMap(c => anosDoPeriodo(c.period))
        const periodo = anos.length > 0 ? (Math.min(...anos) === Math.max(...anos) ? String(anos[0]) : `${Math.min(...anos)}–${Math.max(...anos)}`) : cap[0].period
        return { periodo, titulo: cap[0].title, texto: cap[0].description }
    })

    const temUniverso = relatedArtists.filter(r => r.id !== artist.id).length > 0 || !!grupo
    const temLer = relatedPosts.length > 0
    const abas = [
        { href: '#visao', label: t('tabs.visao') },
        fases.length > 0 && { href: '#carreira', label: t('tabs.carreira') },
        temMusica && { href: '#musica', label: t('tabs.musica') },
        productions.length > 0 && { href: '#obras', label: t('tabs.obras') },
        temUniverso && { href: '#universo', label: t('tabs.universo') },
        temLer && { href: '#ler', label: t('tabs.ler') },
    ].filter(Boolean) as { href: string; label: string }[]

    const atalhos = [
        temMusica && { id: 'musica', tipo: 'listen' as const, detalhe: discography[0]?.title ?? videos[0]?.title },
        productions.length > 0 && { id: 'obras', tipo: 'watch' as const, detalhe: destaques[0] ? tituloDe(destaques[0].p) : tituloDe(productions[0]) },
        temLer && { id: 'ler', tipo: 'read' as const, detalhe: stripHtml(relatedPosts[0].title?.rendered ?? '') },
        fases.length > 0 && { id: 'carreira', tipo: 'understand' as const, detalhe: t('understandDetail', { count: storyChapters.length }) },
    ].filter(Boolean) as { id: string; tipo: 'listen' | 'watch' | 'read' | 'understand'; detalhe?: string }[]

    const idade = model.age
    const cidade = acf.birth_place ? String(acf.birth_place).split(',')[0] : ''
    const fatos: [string, string][] = ([
        acf.birth_date ? [t('born'), formatDate(acf.birth_date, intlLocale(locale))] : null,
        cidade ? [t('city'), cidade] : null,
        acf.debut_date ? [t('debutLabel'), String(acf.debut_date).slice(0, 4)] : null,
        nomeAgencia ? [t('agencyLabel'), nomeAgencia] : null,
        nomeGrupo ? [t('groupFact'), nomeGrupo] : null,
    ].filter(Boolean)) as [string, string][]

    const membros = relatedArtists.filter(r => r.id !== artist.id)
    const papelAtual = [...roleLabels.slice(0, 3), ...(nomeGrupo ? [nomeGrupo] : [])].join(' · ')

    return (
        <>
            {/* Topo */}
            <header className="relative isolate overflow-hidden">
                {image && <Image src={image.src} alt="" fill priority sizes="100vw" aria-hidden className="-z-20 scale-125 object-cover object-[center_20%] opacity-40 blur-[40px] saturate-[1.3]" />}
                <div aria-hidden className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(60% 80% at 20% 30%, color-mix(in srgb, var(--color-accent) 30%, transparent), transparent 70%), linear-gradient(to bottom, rgba(13,11,15,.1), var(--background, #0d0b0f) 96%)' }} />
                <div className={`${COL} grid grid-cols-[112px_minmax(0,1fr)] items-end gap-x-4 gap-y-4 py-8 sm:grid-cols-[300px_minmax(0,1fr)] sm:gap-x-12 sm:py-10`}>
                    {image ? (
                        <Image src={image.src} alt={image.alt || name} width={300} height={400} priority sizes="(min-width: 640px) 300px, 112px"
                            className="aspect-[3/4] w-full object-cover sm:row-span-2" style={{ boxShadow: `10px 10px 0 ${accent}, 0 30px 80px rgba(0,0,0,.7)` }} />
                    ) : (
                        <div className={`flex aspect-[3/4] w-full items-center justify-center border border-border bg-surface text-center text-muted sm:row-span-2 ${KICKER}`}>{t('noPhoto')}</div>
                    )}
                    <div className="min-w-0 self-end sm:self-auto">
                        <p className={`${KICKER} text-muted`}>{papelAtual}</p>
                        <h1 className={`mt-2 ${SERIF} text-[34px] font-bold leading-[.96] sm:text-[88px]`}>{name}<span style={{ color: accent }}>.</span></h1>
                    </div>
                    <div className="col-span-2 sm:col-span-1 sm:self-start">
                        {careerStatement && <p className={`${SERIF} max-w-[760px] text-[20px] leading-[1.2] sm:text-[28px]`}>{careerStatement}</p>}
                        <p className="mt-4 flex flex-wrap gap-x-7 gap-y-1 text-[14px] text-foreground-subtle sm:mt-5 sm:text-[15px]">
                            {idade != null && <span><b className="text-foreground">{t('ageYears', { count: idade })}</b>{cidade ? ` · ${cidade}` : ''}</span>}
                            {acf.debut_date && <span>{t('debutLabel')} <b className="text-foreground">{String(acf.debut_date).slice(0, 4)}</b></span>}
                            {nomeGrupo && <span>{t('groupFact')} <b className="text-foreground">{nomeGrupo}</b></span>}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3 sm:mt-[22px]">
                            {temMusica && <a href="#musica" className="touch-target inline-flex h-12 items-center bg-accent px-7 text-[15px] font-extrabold text-[#0d0b0f] hover:opacity-90">▶ {t('listenNow')}</a>}
                            {productions.length > 0 && <a href="#obras" className="touch-target inline-flex h-12 items-center border border-border-strong px-6 text-[15px] font-semibold hover:border-accent/60">{t('watchWorks')}</a>}
                            <ContentStateButton objectId={artist.id} objectType="artist" label={t('follow')} activeLabel={tp('ui.following')} variant="outline" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Abas */}
            <nav aria-label={t('tabsLabel')} className="border-y border-border bg-background">
                <ul className={`${COL} flex gap-8 overflow-x-auto`}>
                    {abas.map((a, i) => (
                        <li key={a.href} className="shrink-0">
                            <a href={a.href} data-posicao={i + 1} className="flex h-14 items-center border-b-2 text-[14px] font-semibold"
                                style={i === 0 ? { borderColor: accent, color: 'var(--foreground)' } : { borderColor: 'transparent', color: 'var(--muted)' }}>{a.label}</a>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Atalhos por intenção */}
            <ArtistAtalhos destinos={atalhos} accent={accent} />

            {/* Visão geral */}
            <section id="visao" className="scroll-mt-28 border-t border-border py-12 sm:py-[72px]">
                <div className={COL}>
                    <p className={`${KICKER} text-muted`}>{t('overviewKicker')}</p>
                    <h2 className={`mt-2 ${H2}`}>{tp('ui.whoIs', { name })}</h2>
                    <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
                        <div className="artist-bio min-w-0">
                            <div className="profile-prose prose prose-lg max-w-none prose-a:text-accent prose-a:no-underline dark:prose-invert" dangerouslySetInnerHTML={{ __html: highlightProse(contentBefore, name) }} />
                            {contentAfter && (
                                <CollapsibleProse label={tp('ui.bio.continueReading')}>
                                    <div className="profile-prose prose prose-lg max-w-none prose-a:text-accent dark:prose-invert" dangerouslySetInnerHTML={{ __html: highlightProse(contentAfter, name) }} />
                                </CollapsibleProse>
                            )}
                        </div>
                        {fatos.length > 0 && (
                            <dl className="self-start border-l-[3px] pl-5 text-[14px] leading-8 text-foreground-subtle" style={{ borderColor: accent }}>
                                {fatos.map(([k, v]) => (
                                    <div key={k}><dt className="inline font-bold text-foreground">{k} </dt><dd className="inline">{v}</dd></div>
                                ))}
                            </dl>
                        )}
                    </div>
                </div>
            </section>
            {!semAnuncio && <Anuncio placement="artist_apos_visao" layout="leaderboard" />}

            {/* Carreira em fases (a linha do tempo completa fica recolhida logo abaixo) */}
            {fases.length > 0 && (
                <section id="carreira" className="scroll-mt-28 border-t border-border py-12 sm:py-[72px]">
                    <div className={COL}>
                        <p className={`${KICKER} text-muted`}>{t('phasesKicker')}</p>
                        <h2 className={`mt-2 ${H2}`}>{t('phasesTitle', { count: fases.length })}</h2>
                        <ol className="mt-8 grid border-t-2 md:grid-cols-3" style={{ borderColor: accent }}>
                            {fases.map((f, i) => (
                                <li key={`${i}-${f.periodo}`} className="pb-2 pr-6 pt-[22px]">
                                    <span className="font-mono text-[12px]" style={{ color: accent }}>{f.periodo}</span>
                                    <span className={`mt-1.5 block ${SERIF} text-[24px] font-bold leading-tight`}>{f.titulo}</span>
                                    <span className="mt-2 line-clamp-3 block text-[14px] leading-[1.55] text-muted">{f.texto}</span>
                                    <a href="#carreira-completa" className="mt-3 inline-block text-[13px]">→ {t('readChapter').replace(' →', '')}</a>
                                </li>
                            ))}
                        </ol>
                        <details id="carreira-completa" className="mt-6 scroll-mt-28">
                            <summary className={`${BOTAO} list-none cursor-pointer`} style={{ borderColor: accent, color: accent }}>{t('timelineFull')}</summary>
                            <div className="mt-2">
                                <ArtistCarreira id="capitulos" eyebrow={titulos.dossier} titulo={titulos.story} tituloPremios={titulos.awards} capitulos={storyChapters} metricas={keyMetrics} premios={awards} accent={accent} />
                            </div>
                        </details>
                    </div>
                </section>
            )}
            {fases.length === 0 && awards.length > 0 && (
                <Sec id="carreira" kicker={t('phasesKicker')} title={t('awardsAndFacts')}>
                    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {awards.map((a, i) => (
                            <li key={i} className="border border-border p-4">
                                <span className={`${KICKER} text-[10px] text-muted`}>{a.year}</span>
                                <span className="mt-1.5 block font-bold">{a.category}{a.title ? ` · ${a.title}` : ''}</span>
                                {a.event && <span className="mt-1 block text-[12px] text-muted">{a.event}</span>}
                            </li>
                        ))}
                    </ul>
                </Sec>
            )}

            {/* Música: player e Spotify lado a lado, discografia abaixo */}
            {temMusica && (
                <section id="musica" className="scroll-mt-28 border-t border-border py-12 sm:py-[72px]">
                    <div className={`${COL} space-y-10`}>
                        {(videos.length > 0 || spotify) && (
                            <div className={`grid gap-8 ${videos.length > 0 && spotify ? 'lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-6' : ''}`}>
                                {videos.length > 0 && <GroupMVPlayer videos={videos} accent={accent} />}
                                {spotify && <GroupSpotifyEmbed spotifyUrl={spotify} name={name} accent={accent} />}
                            </div>
                        )}
                        {discography.length > 0 && <GroupDiscography albums={discography} accent={accent} />}
                    </div>
                </section>
            )}
            {!semAnuncio && temMusica && <Anuncio placement="artist_apos_musica" />}

            {/* Obras: as três de maior nota e o caminho para a lista inteira */}
            {productions.length > 0 && (
                <Sec id="obras" kicker={t('worksKicker')} title={t('worksTitle')}>
                    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                        {destaques.map(({ p, img }, i) => (
                            <li key={p.id}>
                                <Link href={`/productions/${p.slug}`} className="group relative flex h-[260px] flex-col justify-end overflow-hidden border border-border p-4 sm:h-[300px] sm:p-[18px]">
                                    <Image src={img!.src} alt={img!.alt || tituloDe(p)} fill sizes="(min-width: 1024px) 25vw, 50vw" className="-z-20 object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
                                    <span aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
                                    <span aria-hidden className="absolute right-2.5 -top-1.5 text-[88px] font-extrabold leading-none text-white/15 sm:text-[120px]">{String(i + 1).padStart(2, '0')}</span>
                                    <span className={`${KICKER} block text-[10px] sm:text-[11px]`} style={{ color: accent }}>{[anoDe(p) || null].filter(Boolean).join(' · ')}</span>
                                    <span className={`mt-1.5 block ${SERIF} text-[19px] font-bold leading-[1.1] text-white sm:text-[22px]`}>{tituloDe(p)}</span>
                                    <span className="mt-2 block text-[12px] text-white/80">▶ {t('watch')}</span>
                                </Link>
                            </li>
                        ))}
                        <li>
                            <a href="#obras-completas" className="relative flex h-[260px] flex-col justify-end overflow-hidden border border-border bg-linear-to-br from-[#241a33] to-[#15101a] p-4 sm:h-[300px] sm:p-[18px]">
                                <span aria-hidden className="absolute right-2.5 -top-1.5 text-[88px] font-extrabold leading-none text-white/10 sm:text-[120px]">→</span>
                                <span className={`${KICKER} block text-[10px] sm:text-[11px]`} style={{ color: accent }}>{t('workListKicker')}</span>
                                <span className={`mt-1.5 block ${SERIF} text-[19px] font-bold leading-[1.1] sm:text-[22px]`}>{t('seeFilmography', { count: productions.length })}</span>
                            </a>
                        </li>
                    </ul>
                    <details id="obras-completas" className="mt-6 scroll-mt-28">
                        <summary className={`${BOTAO} list-none cursor-pointer`} style={{ borderColor: accent, color: accent }}>{t('seeAllWorks')}</summary>
                        <div className="mt-4">{nodes.filmografia}</div>
                    </details>
                </Sec>
            )}

            {/* Universo: integrantes do grupo (quando há grupo) ou colegas do mesmo catálogo */}
            {temUniverso && (
                <Sec id="universo" kicker={t('universeKicker')} title={grupo ? t('insideGroup', { group: nomeGrupo ?? '' }) : t('alsoTitle')}>
                    <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                        {membros.slice(0, grupo ? 11 : 3).map(r => {
                            const foto = getWPImage(r._embedded, r.featured_image_url)
                            const nome = stripHtml(r.title?.rendered ?? '')
                            return (
                                <li key={r.id}>
                                    <Link href={`/artists/${r.slug}`} className="flex items-center gap-4 border border-border bg-surface p-4 hover:border-accent/60 sm:p-[18px]">
                                        <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-[26px] font-bold" style={{ background: `linear-gradient(135deg, ${accent}, #5a2a6a)` }}>
                                            {foto ? <Image src={foto.src} alt="" fill sizes="64px" className="object-cover object-top" /> : nome.charAt(0)}
                                        </span>
                                        <span><span className="block text-[16px] font-bold">{nome}</span><span className="mt-1 block text-[13px] text-muted">{t('seeProfile')}</span></span>
                                    </Link>
                                </li>
                            )
                        })}
                        {grupo && (
                            <li>
                                <Link href={`/groups/${grupo.slug}`} className="flex items-center gap-4 border p-4 hover:opacity-90 sm:p-[18px]" style={{ borderColor: accent }}>
                                    <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[26px] font-bold text-[#0d0b0f]" style={{ background: accent }}>{(nomeGrupo ?? '').charAt(0)}</span>
                                    <span><span className="block text-[16px] font-bold">{nomeGrupo}</span><span className="mt-1 block text-[13px]" style={{ color: accent }}>{t('groupPage')}</span></span>
                                </Link>
                            </li>
                        )}
                    </ul>
                    {grupo && <Link href={`/groups/${grupo.slug}`} className={`${BOTAO} list-none`} style={{ borderColor: accent, color: accent }}>{t('exploreUniverse', { group: nomeGrupo ?? '' })}</Link>}
                </Sec>
            )}
            {!semAnuncio && temUniverso && <Anuncio placement="artist_apos_universo" />}

            {/* Leitura */}
            {temLer && (
                <Sec id="ler" kicker={t('readKicker')} title={t('readTitle')}>
                    <ul className="grid gap-3 md:grid-cols-3 md:gap-4">
                        {relatedPosts.slice(0, 3).map(p => {
                            const capa = getWPImage(p._embedded, p.featured_image_url)
                            return (
                                <li key={p.id}>
                                    <Link href={`/blog/${p.slug}`} className="group block h-full overflow-hidden border border-border bg-surface hover:border-accent/60">
                                        <span className="relative block aspect-[16/9] overflow-hidden bg-background">
                                            {capa && <Image src={capa.src} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />}
                                        </span>
                                        <span className="block p-5">
                                            <span className="block text-[16px] font-bold leading-snug">{stripHtml(p.title?.rendered ?? '')}</span>
                                            <span className="mt-1.5 block text-[13px] text-muted">{t('article')}</span>
                                        </span>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                    <Link href={`/blog?search=${encodeURIComponent(name)}`} className={`${BOTAO} list-none`} style={{ borderColor: accent, color: accent }}>{t('seeAllArticles')}</Link>
                </Sec>
            )}

            {!semAnuncio && nodes.faq && <Anuncio placement="artist_pre_faq" layout="leaderboard" />}
            {nodes.faq}

            {/* Tudo o que a proposta não mostra, recolhido e no HTML */}
            {resto.length > 0 && (
                <section className="border-t border-border py-8">
                    <div className={COL}>
                        <details>
                            <summary className="touch-target inline-flex h-11 cursor-pointer list-none items-center border px-5 text-[14px] font-bold" style={{ borderColor: accent, color: accent }}>{t('completeSheet')}</summary>
                            <div className="mt-6">{resto}</div>
                        </details>
                    </div>
                </section>
            )}
        </>
    )
}
