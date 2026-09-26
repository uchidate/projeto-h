import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ADSENSE } from '@/lib/config/ads'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ShareBar } from '@/components/ui/ShareBar'
import { ContentStateButton } from '@/components/features/ContentStateButton'
import { ProfileSidebarAd } from '@/components/profiles/ProfileSidebarAd'
import { CollapsibleProse } from '@/components/profiles/CollapsibleProse'
import { highlightProse } from '@/lib/profiles/highlightProse'
import { getWPImage, stripHtml } from '@/lib/utils'
import type { WPAgency, WPArtist, WPGroup, WPPost, WPProduction } from '@/lib/wordpress/types'
import type { ArtistProfileModel } from '@/lib/profiles/artistProfile'
import { GroupMVPlayer } from '@/components/groups/GroupMVPlayer'
import { GroupDiscography, type DiscographyAlbum } from '@/components/groups/GroupDiscography'
import { GroupSpotifyEmbed } from '@/components/groups/GroupSpotifyEmbed'
import { ArtistCarreira } from '@/components/artists/ArtistCarreira'

interface Props {
    artist: WPArtist
    name: string
    artistUrl: string
    image: { src: string; alt?: string } | null
    roleLabels: string[]
    groups: WPGroup[]
    agency?: WPAgency
    productions: WPProduction[]
    relatedPosts: WPPost[]
    relatedArtists: WPArtist[]
    discography: DiscographyAlbum[]
    model: ArtistProfileModel
    quickFacts: [string, string][]
    magra: boolean
    /** Blocos originais já renderizados, por id: entram como estão onde a ficha C não tem versão própria. */
    nodes: Record<string, ReactNode>
    /** Blocos sem lugar na ficha C; ficam recolhidos, mas no HTML. */
    resto: ReactNode[]
    titulos: { dossier: string; story: string; awards: string }
}

const anoDe = (p: WPProduction) => p.acf?.year ?? (parseInt((p.acf?.release_date ?? p.date ?? '').slice(0, 4)) || 0)
const nota = (p: WPProduction) => p.acf?.rating ?? 0

// A proposta usa o rosa da marca em toda ficha, não a cor de destaque de cada artista.
const ROSA = 'var(--color-accent)'
const KICKER = 'font-mono text-[11px] font-black uppercase tracking-[0.14em]'
const SERIF = 'font-[family-name:var(--font-playfair)]'
const H2 = `${SERIF} text-[28px] font-semibold leading-[1.08] tracking-[-0.01em] sm:text-[38px]`
const COL = 'page-wrap'

function Sec({ id, kicker, title, children, className = '' }: { id?: string; kicker: string; title: string; children: ReactNode; className?: string }) {
    const accent = ROSA
    return (
        <section id={id} className={`scroll-mt-28 py-10 sm:py-14 ${className}`}>
            <div className={COL}>
                <p className={KICKER} style={{ color: accent }}>{kicker}</p>
                <h2 className={`mt-2 ${H2}`}>{title}</h2>
                <div className="mt-6 sm:mt-8">{children}</div>
            </div>
        </section>
    )
}

function Anuncio({ placement, layout = 'content', mediaQuery }: { placement: string; layout?: 'content' | 'leaderboard'; mediaQuery?: string }) {
    const slot = layout === 'leaderboard' ? ADSENSE.slots.leaderboard : ADSENSE.slots.inline
    if (!slot) return null
    return <div className={`${COL} py-4`}><AdSlotInline slot={slot} layout={layout} analyticsPlacement={placement} mediaQuery={mediaQuery} /></div>
}

/**
 * Ficha C, seguindo a proposta de design (Utxu9): topo, abas, obras primeiro, três portas de entrada,
 * perfil com lateral, linha do tempo, três viradas, prêmios, quem aparece junto, notícias e
 * "continue descobrindo". O que a proposta não mostra (análise, redes, hall da fama etc.) fica
 * recolhido em "Ficha completa", no mesmo HTML.
 */
export function ArtistFichaC({
    artist, name, artistUrl, image, roleLabels, groups, agency, productions, relatedPosts, relatedArtists, discography,
    model, quickFacts, magra, nodes, resto, titulos,
}: Props) {
    const accent = ROSA
    const t = useTranslations('profile.artistC')
    const tp = useTranslations('profile')
    const acf = artist.acf ?? {}
    const grupo = groups[0]
    const nomeGrupo = grupo ? stripHtml(grupo.title?.rendered ?? '') : null
    const nomeAgencia = agency ? (stripHtml(agency.title?.rendered ?? '')) : null
    const { storyChapters, awards, keyMetrics, careerStatement, contentBefore, contentAfter, milestones } = model

    const comPoster = productions.map(p => ({ p, img: getWPImage(p._embedded, p.featured_image_url) })).filter(x => x.img)
    const obras = [...comPoster].sort((a, b) => nota(b.p) - nota(a.p) || anoDe(b.p) - anoDe(a.p)).slice(0, 5)
    const portas = comPoster.length >= 3 ? [
        { rotulo: t('doorTop'), x: [...comPoster].sort((a, b) => nota(b.p) - nota(a.p))[0] },
        { rotulo: t('doorNew'), x: [...comPoster].sort((a, b) => anoDe(b.p) - anoDe(a.p))[0] },
        { rotulo: t('doorOld'), x: [...comPoster].sort((a, b) => anoDe(a.p) - anoDe(b.p))[0] },
    ].filter((d, i, arr) => arr.findIndex(o => o.x.p.id === d.x.p.id) === i) : []

    const videos = model.videoList
    const spotify = acf.spotify ? String(acf.spotify) : ''
    const temMusica = videos.length > 0 || discography.length > 0 || !!spotify
    const marcos = storyChapters.length > 0
        ? storyChapters.slice(0, 6).map(c => ({ quando: c.period, titulo: c.title, sub: '' }))
        : milestones.slice(0, 6).map(m => ({ quando: m.year, titulo: m.description, sub: '' }))
    const viradas = storyChapters.slice(0, 3)
    const abas = [
        productions.length > 0 && { href: '#obras', label: t('navObras') },
        temMusica && { href: '#musica', label: t('navMusica') },
        { href: '#perfil', label: t('navPerfil') },
        storyChapters.length > 0 && { href: '#trajetoria', label: t('navTrajetoria') },
        awards.length > 0 && { href: '#premios', label: t('navPremios') },
        (relatedArtists.length > 0 || grupo) && { href: '#universo', label: t('navUniverso') },
        relatedPosts.length > 0 && { href: '#noticias', label: t('navNoticias') },
    ].filter(Boolean) as { href: string; label: string }[]
    const meta = [
        model.age != null && [`${model.age}`, acf.birth_place ? String(acf.birth_place).split(',')[0] : ''],
    ].filter(Boolean) as string[][]
    const frase = careerStatement ?? null
    const semAnuncio = magra

    return (
        <>
            {/* Topo */}
            <header className="relative isolate overflow-hidden">
                {image && <Image src={image.src} alt="" fill priority sizes="100vw" aria-hidden className="-z-20 scale-125 object-cover object-[center_20%] opacity-40 blur-[38px] saturate-[1.3]" />}
                <div aria-hidden className="absolute inset-0 -z-10" style={{ background: `radial-gradient(60% 80% at 20% 30%, color-mix(in srgb, var(--color-accent) 30%, transparent), transparent 70%), linear-gradient(to bottom, rgba(13,11,15,.1), var(--background, #0d0b0f) 96%)` }} />
                {acf.name_hangul && <span aria-hidden className="pointer-events-none absolute right-10 -top-5 hidden select-none text-[230px] font-extrabold leading-none text-foreground/[0.06] sm:block">{acf.name_hangul}</span>}
                <div className={`${COL} grid grid-cols-[112px_minmax(0,1fr)] items-end gap-x-4 gap-y-4 py-8 sm:grid-cols-[300px_minmax(0,1fr)] sm:gap-x-12 sm:py-10`}>
                    {image ? (
                        <Image src={image.src} alt={image.alt || name} width={300} height={400} priority sizes="(min-width: 640px) 300px, 112px"
                            className="aspect-[3/4] w-full object-cover sm:row-span-2" style={{ boxShadow: `16px 16px 0 ${accent}, 0 30px 80px rgba(0,0,0,.7)` }} />
                    ) : (
                        <div className={`flex aspect-[3/4] w-full items-center justify-center border border-border bg-surface text-center text-muted sm:row-span-2 ${KICKER}`}>{t('noPhoto')}</div>
                    )}
                    <div className="min-w-0 self-end sm:self-auto">
                        <p className={`${KICKER} text-muted`}>{[...roleLabels.slice(0, 3), ...(nomeGrupo ? [nomeGrupo] : [])].join(' · ')}</p>
                        <h1 className={`mt-2 ${SERIF} text-[34px] font-bold leading-[.98] sm:text-[88px]`}>{name}<span style={{ color: accent }}>.</span></h1>
                        {acf.name_hangul && <p className="mt-1 text-[13px] text-muted sm:hidden">{acf.name_hangul}{model.age != null ? ` · ${model.age} anos` : ''}</p>}
                    </div>
                    <div className="col-span-2 sm:col-span-1 sm:self-start">
                        {frase && <p className={`${SERIF} max-w-[720px] text-[20px] leading-[1.2] sm:text-[30px]`}>{frase}</p>}
                        <p className="mt-4 flex flex-wrap gap-x-7 gap-y-1 text-[14px] text-foreground-subtle sm:mt-5 sm:text-[15px]">
                            {meta[0] && <span><b className="text-foreground">{meta[0][0]} anos</b>{meta[0][1] ? ` · ${meta[0][1]}` : ''}</span>}
                            {acf.debut_date && <span>{tp('ui.debut')} <b className="text-foreground">{String(acf.debut_date).slice(0, 4)}</b></span>}
                            {agency && <span>{tp('ui.agency')} <b className="text-foreground">{nomeAgencia}</b></span>}
                        </p>
                        <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-6">
                            <ContentStateButton objectId={artist.id} objectType="artist" label={tp('ui.followArtist')} activeLabel={tp('ui.following')} variant="primary" />
                            {productions.length > 0 && (
                                <a href="#obras" className="touch-target inline-flex h-12 items-center border border-border px-6 text-[15px] font-semibold hover:border-accent/60">{t('viewWorks')}</a>
                            )}
                            <ShareBar url={artistUrl} title={tp('ui.onSite', { name })} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Abas */}
            <nav aria-label={t('tabsLabel')} className="border-y border-border/70 bg-background">
                <ul className={`${COL} flex gap-7 overflow-x-auto`}>
                    {abas.map((a, i) => (
                        <li key={a.href} className="shrink-0">
                            <a href={a.href} data-posicao={i + 1} className="flex h-[52px] items-center border-b-2 text-[14px] font-semibold"
                                style={i === 0 ? { borderColor: accent, color: accent } : { borderColor: 'transparent' }}>{a.label}</a>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Ficha magra sem obras: o grupo vem primeiro */}
            {productions.length === 0 && nodes.grupos}

            {/* Obras */}
            {obras.length > 0 && (
                <Sec id="obras" kicker={t('mostKnown')} title={t('topWorks')} >
                    <div className="-mt-2 mb-4 flex justify-end">
                        <a href="#obras-completas" className="text-[14px] font-semibold" style={{ color: accent }}>{t('seeAll', { count: productions.length })}</a>
                    </div>
                    <ul className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-5 sm:px-0">
                        {obras.map(({ p, img }, i) => (
                            <li key={p.id} className="w-[136px] shrink-0 sm:w-[250px]">
                                <Link href={`/productions/${p.slug}`} className="group block">
                                    <span className="relative block aspect-[2/3] overflow-hidden shadow-[0_18px_44px_rgba(0,0,0,.55)]">
                                        <Image src={img!.src} alt={img!.alt || stripHtml(p.title?.rendered ?? '')} fill sizes="(min-width: 640px) 250px, 136px" className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
                                        <span className="absolute right-2 top-2 border px-2 py-1 text-[11px] font-bold" style={{ borderColor: accent, color: accent, background: 'rgba(13,11,15,.85)' }}>▶ {t('watch')}</span>
                                        <span aria-hidden className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/85 to-transparent" />
                                        <span aria-hidden className={`absolute bottom-1 left-2 ${SERIF} text-[56px] font-bold leading-none text-transparent sm:text-[80px]`} style={{ WebkitTextStroke: '1.5px rgba(255,255,255,.85)' }}>{String(i + 1).padStart(2, '0')}</span>
                                    </span>
                                    <span className="mt-2.5 block text-[14px] font-bold leading-tight sm:text-[16px]">{stripHtml(p.title?.rendered ?? '')}</span>
                                    <span className="mt-1 block text-[12px] text-foreground-subtle sm:text-[13px]">{anoDe(p) || ''}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <details id="obras-completas" className="group/lista mt-6 scroll-mt-28">
                        <summary className="touch-target inline-flex h-11 cursor-pointer list-none items-center border px-5 text-[14px] font-bold" style={{ borderColor: accent, color: accent }}>{t('fullList', { count: productions.length })}</summary>
                        <div className="mt-4">{nodes.filmografia}</div>
                    </details>
                </Sec>
            )}

            {/* Por onde começar */}
            {portas.length >= 2 && (
                <Sec kicker={t('startKicker')} title={t('doorsTitle')} className="pt-2 sm:pt-2">
                    <ul className="grid gap-4 lg:grid-cols-3">
                        {portas.map(({ rotulo, x }) => (
                            <li key={x.p.id}>
                                <Link href={`/productions/${x.p.slug}`} className="flex h-full gap-4 border border-border bg-surface p-4 hover:border-accent/60">
                                    <Image src={x.img!.src} alt="" width={110} height={165} sizes="110px" className="h-[132px] w-[88px] shrink-0 object-cover sm:h-[165px] sm:w-[110px]" />
                                    <span className="min-w-0">
                                        <span className={`${KICKER} block text-[10px]`} style={{ color: accent }}>{rotulo}</span>
                                        <span className={`mt-2 block ${SERIF} text-[20px] leading-[1.15] sm:text-[22px]`}>{stripHtml(x.p.title?.rendered ?? '')}</span>
                                        <span className="mt-2 line-clamp-3 block text-[13px] leading-5 text-foreground-subtle">{stripHtml(x.p.excerpt?.rendered ?? '')}</span>
                                        <span className="mt-3 inline-block border px-2.5 py-1.5 text-[12px] font-bold" style={{ borderColor: accent, color: accent }}>▶ {t('whereToWatch')}</span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Sec>
            )}
            {!semAnuncio && <Anuncio placement="artist_apos_obras" layout="leaderboard" />}

            {/* Música: player e Spotify lado a lado, discografia abaixo */}
            {temMusica && (
                <section id="musica" className="scroll-mt-28 py-10 sm:py-14">
                    <div className={`${COL} space-y-10`}>
                        {(videos.length > 0 || spotify) && (
                            <div className={`grid gap-8 ${videos.length > 0 && spotify ? 'lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-10' : ''}`}>
                                {videos.length > 0 && <GroupMVPlayer videos={videos} accent={accent} />}
                                {spotify && <GroupSpotifyEmbed spotifyUrl={spotify} name={name} accent={accent} />}
                            </div>
                        )}
                        {discography.length > 0 && <GroupDiscography albums={discography} accent={accent} />}
                    </div>
                </section>
            )}

            {/* Perfil */}
            <section id="perfil" className="scroll-mt-28 py-10 sm:py-14">
                <div className={`${COL} grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16`}>
                    <div className="max-w-[720px]">
                        <p className={KICKER} style={{ color: accent }}>{t('navPerfil')}</p>
                        <h2 className={`mt-2 ${H2}`}>{tp('ui.whoIs', { name })}</h2>
                        <div className="artist-bio mt-5">
                            <div className="profile-prose prose prose-lg max-w-none prose-a:text-accent prose-a:no-underline dark:prose-invert" dangerouslySetInnerHTML={{ __html: highlightProse(contentBefore, name) }} />
                            {!semAnuncio && contentAfter && ADSENSE.slots.inline && (
                                <div className="lg:hidden">
                                    <AdSlotInline slot={ADSENSE.slots.inline} layout="content" analyticsPlacement="artist_perfil_mobile" mediaQuery="(max-width: 1023px)" />
                                </div>
                            )}
                            {contentAfter && (
                                <CollapsibleProse label={tp('ui.bio.continueReading')}>
                                    <div className="profile-prose prose prose-lg max-w-none prose-a:text-accent dark:prose-invert" dangerouslySetInnerHTML={{ __html: highlightProse(contentAfter, name) }} />
                                </CollapsibleProse>
                            )}
                        </div>
                    </div>
                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <p className={`${KICKER} mb-1.5 text-[10px] text-muted`}>{t('dataEssentials')}</p>
                        <dl>
                            {quickFacts.map(([k, v]) => (
                                <div key={k} className="border-t border-border/70 py-3">
                                    <dt className={`${KICKER} text-[10px] text-muted`}>{k}</dt>
                                    <dd className="mt-1 text-[15px] font-bold">{v}</dd>
                                </div>
                            ))}
                        </dl>
                        {!semAnuncio && <div className="mt-5 hidden lg:block"><ProfileSidebarAd analyticsPlacement="artist_lateral_fixa" /></div>}
                    </aside>
                </div>
            </section>

            {/* Linha do tempo */}
            {marcos.length >= 3 && (
                <Sec kicker={t('timelineKicker')} title={t('timelineTitle')} >
                    <ol className="flex flex-col gap-5 sm:flex-row sm:gap-0 sm:overflow-x-auto">
                        {marcos.map((m, i) => (
                            <li key={`${i}-${m.quando}`} className="relative pl-7 sm:w-[210px] sm:shrink-0 sm:pl-0 sm:pr-4">
                                <span aria-hidden className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 bg-background sm:static sm:mt-3 sm:block" style={{ borderColor: accent }} />
                                <span className={`${KICKER} block sm:order-first`} style={{ color: accent }}>{m.quando}</span>
                                <span className="mt-1 block text-[17px] font-bold leading-snug sm:mt-2 sm:text-[20px]">{m.titulo}</span>
                            </li>
                        ))}
                    </ol>
                </Sec>
            )}

            {/* Trajetória: três viradas + capítulos completos recolhidos */}
            {viradas.length > 0 && (
                <section id="trajetoria" className="scroll-mt-28 bg-surface/50 py-10 sm:py-14">
                    <div className={COL}>
                        <p className={KICKER} style={{ color: accent }}>{t('turnsKicker')}</p>
                        <h2 className={`mt-2 ${H2}`}>{t('turnsTitle')}</h2>
                        <ul className="mt-6 grid gap-4 md:grid-cols-3">
                            {viradas.map((c, i) => (
                                <li key={`${i}-${c.period}`} className="relative flex min-h-[240px] flex-col justify-end overflow-hidden border-t-2 p-5 sm:min-h-[300px]" style={{ borderColor: accent }}>
                                    {c.visual_url && <Image src={c.visual_url} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="-z-20 object-cover" aria-hidden />}
                                    <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/55 to-black/25" />
                                    <span className={`${KICKER} text-[10px]`} style={{ color: accent }}>{c.period}</span>
                                    <span className={`mt-2 block ${SERIF} text-[22px] leading-[1.2] text-white`}>{c.title}</span>
                                    <a href="#trajetoria-completa" className="mt-2.5 inline-block text-[13px] font-semibold text-white">{t('readChapter')}</a>
                                </li>
                            ))}
                        </ul>
                        <details id="trajetoria-completa" className="mt-6 scroll-mt-28">
                            <summary className="touch-target inline-flex h-11 cursor-pointer list-none items-center border px-5 text-[14px] font-bold" style={{ borderColor: accent, color: accent }}>{t('fullTrajectory')}</summary>
                            <div className="mt-2">
                                <ArtistCarreira id="capitulos" eyebrow={titulos.dossier} titulo={titulos.story} tituloPremios={titulos.awards} capitulos={storyChapters} metricas={keyMetrics} premios={[]} accent={accent} />
                            </div>
                        </details>
                    </div>
                </section>
            )}
            {!semAnuncio && <Anuncio placement="artist_entre_secoes" />}

            {/* Prêmios */}
            {awards.length > 0 && (
                <Sec id="premios" kicker={t('awardsKicker')} title={titulos.awards} className="pt-2 sm:pt-2">
                    <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
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

            {/* Universo: integrantes do grupo (quando há grupo) ou colegas do mesmo catálogo */}
            {(relatedArtists.length > 0 || grupo) && (
                <Sec id="universo" kicker={grupo ? t('membersKicker') : t('alsoKicker')} title={grupo ? t('membersTitle', { group: nomeGrupo ?? '' }) : t('alsoTitle')} className="pt-2 sm:pt-2">
                    <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                        {relatedArtists.filter(r => r.id !== artist.id).slice(0, grupo ? 11 : 4).map(r => {
                            const foto = getWPImage(r._embedded, r.featured_image_url)
                            const nome = stripHtml(r.title?.rendered ?? '')
                            return (
                                <li key={r.id}>
                                    <Link href={`/artists/${r.slug}`} className="flex items-center gap-4 border border-border bg-surface p-4 hover:border-accent/60 sm:flex-col sm:text-center">
                                        <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-[26px] font-bold sm:h-24 sm:w-24" style={{ background: `linear-gradient(135deg, ${accent}, #6b3fa0)` }}>
                                            {foto ? <Image src={foto.src} alt="" fill sizes="96px" className="object-cover" /> : nome.charAt(0)}
                                        </span>
                                        <span><span className="block text-[16px] font-bold">{nome}</span><span className="mt-1 block text-[13px] text-muted">{t('seeProfile')}</span></span>
                                    </Link>
                                </li>
                            )
                        })}
                        {grupo && (
                            <li>
                                <Link href={`/groups/${grupo.slug}`} className="flex items-center gap-4 border p-4 hover:opacity-90 sm:flex-col sm:text-center" style={{ borderColor: accent }}>
                                    <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[26px] font-bold text-[#0d0b0f] sm:h-24 sm:w-24" style={{ background: accent }}>{(nomeGrupo ?? '').charAt(0)}</span>
                                    <span><span className="block text-[16px] font-bold">{nomeGrupo}</span><span className="mt-1 block text-[13px]" style={{ color: accent }}>{t('groupPage')}</span></span>
                                </Link>
                            </li>
                        )}
                    </ul>
                </Sec>
            )}

            {!semAnuncio && (relatedArtists.length > 0 || grupo) && <Anuncio placement="artist_pos_universo" />}

            {/* Notícias */}
            {relatedPosts.length > 0 && (
                <Sec id="noticias" kicker={t('newsKicker')} title={t('newsTitle')} className="pt-2 sm:pt-2">
                    <ul className="grid gap-3.5 md:grid-cols-3">
                        {relatedPosts.slice(0, 3).map(p => {
                            const capa = getWPImage(p._embedded, p.featured_image_url)
                            return (
                                <li key={p.id}>
                                    <Link href={`/blog/${p.slug}`} className="group block h-full overflow-hidden border border-border bg-surface hover:border-accent/60">
                                        <span className="relative block aspect-[16/9] overflow-hidden bg-background">
                                            {capa && <Image src={capa.src} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />}
                                        </span>
                                        <span className="block p-4">
                                            <span className={`${KICKER} text-[10px]`} style={{ color: accent }}>{t('newsTag')}</span>
                                            <span className="mt-2 block text-[17px] font-bold leading-snug">{stripHtml(p.title?.rendered ?? '')}</span>
                                        </span>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </Sec>
            )}

            {!semAnuncio && nodes.faq && <Anuncio placement="artist_pre_faq" layout="leaderboard" />}
            {nodes.faq}

            {/* Continue descobrindo */}
            {(agency || grupo) && (
                <section className="border-t border-border bg-surface/60 py-10 sm:py-14">
                    <div className={COL}>
                        <p className={KICKER} style={{ color: accent }}>{t('keepKicker')}</p>
                        <h2 className={`mt-2 ${H2}`}>{t('keepTitle')}</h2>
                        <ul className="mt-6 grid gap-4 md:grid-cols-3">
                            {agency && (
                                <li><Link href={`/agencies/${agency.slug}`} className="block h-full border p-5" style={{ borderColor: accent }}>
                                    <span className={`${KICKER} text-[10px]`} style={{ color: accent }}>{t('sameAgency')}</span>
                                    <span className={`mt-2 block ${SERIF} text-[24px]`}>{nomeAgencia}</span>
                                </Link></li>
                            )}
                            {grupo && (
                                <li><Link href={`/groups/${grupo.slug}`} className="block h-full border border-border p-5 hover:border-accent/60">
                                    <span className={`${KICKER} text-[10px] text-muted`}>{t('groupLabel')}</span>
                                    <span className={`mt-2 block ${SERIF} text-[24px]`}>{nomeGrupo}</span>
                                </Link></li>
                            )}
                            <li><Link href="/quiz" className="block h-full border border-border p-5 hover:border-accent/60">
                                <span className={`${KICKER} text-[10px] text-muted`}>{t('quizLabel')}</span>
                                <span className={`mt-2 block ${SERIF} text-[24px] leading-tight`}>{t('quizTitle')}</span>
                            </Link></li>
                        </ul>
                    </div>
                </section>
            )}

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
