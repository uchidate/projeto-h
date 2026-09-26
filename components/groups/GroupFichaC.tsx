import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { labelsFor } from '@/lib/i18n/labels'
import { ADSENSE } from '@/lib/config/ads'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ProfileSidebarAd } from '@/components/profiles/ProfileSidebarAd'
import { CollapsibleProse } from '@/components/profiles/CollapsibleProse'
import { highlightProse } from '@/lib/profiles/highlightProse'
import { extractYoutubeId, getWPImage, stripHtml } from '@/lib/utils'
import { POSITION_LABELS } from '@/lib/constants/positions'
import { GroupMVPlayer } from '@/components/groups/GroupMVPlayer'
import { GroupDiscography, type DiscographyAlbum } from '@/components/groups/GroupDiscography'
import { GroupSpotifyEmbed } from '@/components/groups/GroupSpotifyEmbed'
import { toMemberSummary } from '@/lib/artists/memberSummary'
import { linhasIntegrantes } from '@/lib/seo/integrantes'
import { GroupMembersTable } from '@/components/groups/GroupMembersTable'
import type { GroupProfileModel } from '@/lib/profiles/groupProfile'
import type { WPArtist, WPGroup, WPPost } from '@/lib/wordpress/types'

interface Props {
    group: WPGroup
    model: GroupProfileModel
    activeMembers: WPArtist[]
    formerMembers: WPArtist[]
    formerSemFicha: { slug: string; name: string }[]
    memberPositions: Record<string, string[]>
    relatedGroups: WPGroup[]
    relatedPosts: WPPost[]
    discography: DiscographyAlbum[]
    agencyName: string | null
    generation: string | null
    magra: boolean
    /** Blocos originais já renderizados, por id. */
    nodes: Record<string, ReactNode>
    /** Blocos sem lugar na ficha nova; ficam recolhidos, mas no HTML. */
    resto: ReactNode[]
}

const LILAS = 'var(--group-accent, var(--color-accent))'
const KICKER = 'font-mono text-[11px] font-black uppercase tracking-[0.14em]'
const SERIF = 'font-[family-name:var(--font-playfair)]'
const H2 = `${SERIF} text-[28px] font-semibold leading-[1.05] sm:text-[38px]`
const COL = 'page-wrap'

function Anuncio({ placement, layout = 'content' }: { placement: string; layout?: 'content' | 'leaderboard' }) {
    const slot = layout === 'leaderboard' ? ADSENSE.slots.leaderboard : ADSENSE.slots.inline
    if (!slot) return null
    return <div className={`${COL} py-4`}><AdSlotInline slot={slot} layout={layout} analyticsPlacement={placement} /></div>
}

/**
 * Corpo da página de grupo na proposta "Página de grupo": integrantes primeiro, depois música, carreira,
 * sobre, fandom e leitura. O que a proposta não mostra fica recolhido no mesmo HTML.
 */
export function GroupFichaC({ group, model, activeMembers, formerMembers, formerSemFicha, memberPositions, relatedGroups, relatedPosts, discography, agencyName, generation, magra, nodes, resto }: Props) {
    const t = useTranslations('profile.groupC')
    const labels = labelsFor(useLocale())
    const accent = model.accent
    const { name, acf, contentBefore, contentAfter, videoList } = model
    const spotify = acf.spotify ?? ''
    const temMusica = videoList.length > 0 || discography.length > 0 || !!spotify
    const capitulos = acf.story_chapters ?? []
    const metricas = (acf.key_metrics ?? []).filter(m => m.value && m.label)
    const temCarreira = capitulos.length > 0 || metricas.length >= 3
    const temFandom = activeMembers.length > 1 || !!acf.color
    const linhas = linhasIntegrantes(activeMembers.map(toMemberSummary), memberPositions)
    const linhaDe = (slug: string) => linhas.find(l => l.slug === slug)
    const citacao = capitulos.find(c => c.quote_text && c.quote_author)
    const semAnuncio = magra
    const clipes = videoList.map(v => ({ ...v, id: extractYoutubeId(v.url) })).filter((v): v is typeof v & { id: string } => !!v.id).slice(0, 3)
    const porIntegrante = activeMembers.filter(m => getWPImage(m._embedded, m.featured_image_url)).slice(0, 3)
    const comeceAqui = clipes.length >= 2 && porIntegrante.length >= 2
    const temFormacao = formerMembers.length + formerSemFicha.length > 0

    const abas = [
        activeMembers.length > 0 && { href: '#membros', label: t('tabs.membros') },
        temMusica && { href: '#musica', label: t('tabs.musica') },
        temCarreira && { href: '#carreira', label: t('tabs.carreira') },
        temFandom && { href: '#fandom', label: t('tabs.fandom') },
        relatedPosts.length > 0 && { href: '#ler', label: t('tabs.ler') },
    ].filter(Boolean) as { href: string; label: string }[]

    const ficha: [string, string][] = ([
        acf.type && [t('type'), labels.groupType(acf.type)],
        acf.fandom_name && [t('fandomFact'), acf.fandom_name],
        generation && [t('generation'), generation],
        agencyName && [t('agency'), agencyName],
        acf.name_meaning && [t('meaning'), acf.name_meaning],
    ].filter(Boolean)) as [string, string][]

    return (
        <>
            {abas.length > 1 && (
                <nav aria-label={t('tabsLabel')} className="border-y border-border bg-background">
                    <ul className={`${COL} flex gap-8 overflow-x-auto`}>
                        {abas.map((a, i) => (
                            <li key={a.href} className="shrink-0">
                                <a href={a.href} data-posicao={i + 1} className="flex h-12 items-center border-b-2 text-[14px] font-semibold sm:h-[52px]"
                                    style={i === 0 ? { borderColor: accent, color: accent } : { borderColor: 'transparent', color: 'var(--muted)' }}>{a.label}</a>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}

            {/* Integrantes */}
            {activeMembers.length > 0 && (
                <section id="membros" className="scroll-mt-28 py-10 sm:py-12" data-bloco="grupo-integrantes">
                    <div className={COL}>
                        <div className="flex items-baseline justify-between gap-4">
                            <h2 className={H2}>{t('members')}<span className="ml-3.5 font-sans text-[13px] font-semibold text-muted sm:text-[14px]">{activeMembers.length}</span></h2>
                        </div>
                        <ul className={`mt-6 grid grid-cols-2 gap-x-3 gap-y-5 sm:mt-7 sm:gap-5 ${activeMembers.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
                            {activeMembers.map(m => {
                                const foto = getWPImage(m._embedded, m.featured_image_url)
                                const nome = stripHtml(m.title?.rendered ?? '')
                                const linha = linhaDe(m.slug)
                                const pos = (memberPositions[m.slug] ?? []).map(p => POSITION_LABELS[p] ?? p)
                                const meta = [...pos, linha?.idade != null ? t('years', { count: linha.idade }) : null].filter(Boolean).join(t('positionSep'))
                                return (
                                    <li key={m.id}>
                                        <Link href={`/artists/${m.slug}`} className="group block">
                                            <span className="relative block aspect-3/4 overflow-hidden bg-surface shadow-[0_18px_44px_rgba(0,0,0,.55)]">
                                                {foto && <Image src={foto.src} alt={foto.alt || nome} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" />}
                                            </span>
                                            <span className="mt-3.5 flex items-baseline justify-between gap-2">
                                                <span className="truncate text-[16px] font-bold sm:text-[20px]">{nome}</span>
                                                {m.acf?.name_hangul && <span className="hidden shrink-0 text-[13px] text-muted sm:inline">{m.acf.name_hangul}</span>}
                                            </span>
                                            {meta && <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.06em] sm:text-[11px]" style={{ color: accent }}>{meta}</span>}
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                        {linhas.length > 0 && (
                            <details className="mt-5 sm:mt-6">
                                <summary className="touch-target flex h-12 cursor-pointer list-none items-center justify-center border border-border-strong text-[14px] font-semibold sm:inline-flex sm:h-auto sm:border-0 sm:text-[14px]" style={{ color: accent }}>{t('agePosition')} ▾</summary>
                                <div className="mt-3"><GroupMembersTable groupName={name} linhas={linhas} /></div>
                            </details>
                        )}
                    </div>
                </section>
            )}
            {!semAnuncio && <Anuncio placement="group_apos_integrantes" layout="leaderboard" />}

            {/* Comece por aqui */}
            {comeceAqui && (
                <section id="comece" className="scroll-mt-28 border-t border-border py-10 sm:py-12" data-bloco="grupo-comece">
                    <div className={COL}>
                        <h2 className={H2}>{t('start')}</h2>
                        <p className="mt-2 text-[15px] text-muted">{t('startSub', { name })}</p>
                        <div className="mt-6 grid gap-5 md:grid-cols-2">
                            <div className="border border-border-strong bg-surface p-5 sm:p-[22px]">
                                <p className={KICKER} style={{ color: accent }}>{t('byMember')}</p>
                                <p className={`${SERIF} mt-1.5 text-[22px] font-semibold sm:text-[24px]`}>{t('byMemberTitle')}</p>
                                <ul className="mt-4 flex flex-col gap-2.5">
                                    {porIntegrante.map(m => {
                                        const foto = getWPImage(m._embedded, m.featured_image_url)
                                        const nome = stripHtml(m.title?.rendered ?? '')
                                        const pos = (memberPositions[m.slug] ?? []).map(p => POSITION_LABELS[p] ?? p).join(t('positionSep'))
                                        return (
                                            <li key={m.id}>
                                                <Link href={`/artists/${m.slug}`} className="touch-target flex items-center gap-3.5 bg-background/40 p-2">
                                                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-surface">{foto && <Image src={foto.src} alt="" fill sizes="56px" className="object-cover object-top" />}</span>
                                                    <span className="min-w-0"><span className="block truncate text-[15px] font-bold">{nome}</span>{pos && <span className="mt-0.5 block truncate text-[12px] text-muted">{pos}</span>}</span>
                                                    <span aria-hidden className="ml-auto pr-1" style={{ color: accent }}>›</span>
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                            <div className="border border-border-strong bg-surface p-5 sm:p-[22px]">
                                <p className={KICKER} style={{ color: accent }}>{t('byClip')}</p>
                                <p className={`${SERIF} mt-1.5 text-[22px] font-semibold sm:text-[24px]`}>{t('byClipTitle')}</p>
                                <ul className="mt-4 flex flex-col gap-2.5">
                                    {clipes.map(v => (
                                        <li key={v.id}>
                                            <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" className="touch-target flex items-center gap-3.5 bg-background/40 p-2">
                                                <span className="relative h-14 w-[100px] shrink-0 overflow-hidden bg-surface"><Image src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`} alt="" fill sizes="100px" className="object-cover" /></span>
                                                <span className="min-w-0"><span className="block truncate text-[15px] font-bold">{v.title}</span><span className="mt-0.5 block truncate text-[12px] text-muted">{t('clip')}</span></span>
                                                <span aria-hidden className="ml-auto pr-1" style={{ color: accent }}>›</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Música */}
            {temMusica && (
                <section id="musica" className="scroll-mt-28 border-t border-border py-10 sm:py-12">
                    <div className={`${COL} space-y-10`}>
                        <h2 className={H2}>{t('music')}</h2>
                        {(videoList.length > 0 || spotify) && (
                            <div className={`grid gap-8 ${videoList.length > 0 && spotify ? 'lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-6' : ''}`}>
                                {videoList.length > 0 && <GroupMVPlayer videos={videoList} accent={accent} />}
                                {spotify && <GroupSpotifyEmbed spotifyUrl={spotify} name={name} accent={accent} />}
                            </div>
                        )}
                        {discography.length > 0 && <GroupDiscography albums={discography} accent={accent} />}
                    </div>
                </section>
            )}

            {/* Carreira: marcos, números e a citação; a análise e os capítulos completos ficam recolhidos */}
            {temCarreira && (
                <section id="carreira" className="scroll-mt-28 border-t border-border py-10 sm:py-12">
                    <div className={COL}>
                        <h2 className={H2}>{t('career')}</h2>
                        {capitulos.length > 0 && (
                            <ol className="mt-8 grid gap-[18px] sm:grid-cols-3 lg:grid-cols-6 lg:gap-0">
                                {capitulos.slice(0, 6).map((c, i) => (
                                    <li key={`${i}-${c.period}`} className="relative pl-7 sm:pl-0 sm:pr-4">
                                        <span aria-hidden className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 bg-background sm:hidden" style={{ borderColor: accent }} />
                                        <span className={`${KICKER} block`} style={{ color: accent }}>{c.period}</span>
                                        <span aria-hidden className="my-3 hidden h-0.5 bg-border sm:block" />
                                        <span className="mt-1 block text-[17px] font-bold leading-snug sm:mt-0">{c.title}</span>
                                    </li>
                                ))}
                            </ol>
                        )}
                        {metricas.length >= 3 && (
                            <dl className="mt-10 grid grid-cols-2 gap-x-4 gap-y-6 border-t border-border pt-6 lg:grid-cols-4 lg:gap-6">
                                {metricas.slice(0, 4).map(m => (
                                    <div key={m.label} className="flex flex-col">
                                        <dd className={`order-1 ${SERIF} text-[40px] font-bold leading-none sm:text-[54px]`} style={{ color: accent }}>{m.value}</dd>
                                        <dt className="order-2 mt-2 text-[13px] leading-snug text-foreground-subtle sm:text-[14px]">{m.label}</dt>
                                    </div>
                                ))}
                            </dl>
                        )}
                        {citacao && (
                            <figure className="mt-8 border border-border bg-surface px-[18px] py-[18px] sm:px-7 sm:py-[22px]">
                                <blockquote className={`${SERIF} text-[20px] leading-snug sm:text-[26px]`}>“{citacao.quote_text}”</blockquote>
                                <figcaption className={`${KICKER} mt-3 text-[10px]`} style={{ color: accent }}>{citacao.quote_author}{citacao.quote_context ? ` · ${citacao.quote_context}` : ''}</figcaption>
                            </figure>
                        )}
                        <details className="mt-6">
                            <summary className="touch-target flex h-12 cursor-pointer list-none items-center justify-center border px-6 text-[15px] font-bold sm:inline-flex" style={{ borderColor: accent, color: accent }}>{t('fullCareer')} ▾</summary>
                            <div className="mt-6 space-y-10">{nodes.analise}{nodes.trajetoria}{nodes.recordes}</div>
                        </details>
                    </div>
                </section>
            )}
            {!semAnuncio && temCarreira && <Anuncio placement="group_apos_carreira" />}

            {/* Formação: só com ex-integrantes cadastrados */}
            {temFormacao && (
                <section id="formacao" className="scroll-mt-28 border-t border-border py-10 sm:py-12" data-bloco="grupo-formacao">
                    <div className={COL}>
                        <h2 className={H2}>{t('lineupTitle')}</h2>
                        <p className="mt-2 text-[15px] text-muted">{t('lineupSub')}</p>
                        <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-5">
                            {[...activeMembers.map(m => ({ m, ex: false })), ...formerMembers.map(m => ({ m, ex: true }))].map(({ m, ex }) => {
                                const foto = getWPImage(m._embedded, m.featured_image_url)
                                const nome = stripHtml(m.title?.rendered ?? '')
                                return (
                                    <li key={m.id} className={ex ? 'opacity-60' : undefined}>
                                        <Link href={`/artists/${m.slug}`} className="block">
                                            <span className="relative block aspect-3/4 overflow-hidden bg-surface">{foto && <Image src={foto.src} alt={foto.alt || nome} fill sizes="(max-width: 640px) 50vw, 20vw" className="object-cover object-top" />}</span>
                                            <span className="mt-2.5 block truncate text-[15px] font-bold">{nome}</span>
                                            <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: ex ? 'var(--muted)' : accent }}>{ex ? t('lineupFormer') : t('lineupActive')}</span>
                                        </Link>
                                    </li>
                                )
                            })}
                            {formerSemFicha.map(e => (
                                <li key={e.slug} className="opacity-60">
                                    <span className="flex aspect-3/4 items-end bg-surface p-3 text-[15px] font-bold">{e.name}</span>
                                    <span className="mt-2.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-muted">{t('lineupFormer')}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}

            {/* Sobre + ficha lateral */}
            {(model.hasBio || ficha.length > 0) && (
                <section id="sobre" className="scroll-mt-28 border-t border-border py-10 sm:py-12">
                    <div className={`${COL} grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16`}>
                        <div className="max-w-[720px]">
                            <h2 className={`${SERIF} text-[26px] font-semibold leading-tight sm:text-[34px]`}>{t('about', { name })}</h2>
                            <div className="group-bio mt-5">
                                <div className="profile-prose prose prose-lg max-w-none prose-a:text-accent prose-a:no-underline dark:prose-invert" dangerouslySetInnerHTML={{ __html: highlightProse(contentBefore, name) }} />
                                {contentAfter && <CollapsibleProse label="Continuar lendo"><div className="profile-prose prose prose-lg max-w-none prose-a:text-accent dark:prose-invert" dangerouslySetInnerHTML={{ __html: highlightProse(contentAfter, name) }} /></CollapsibleProse>}
                            </div>
                        </div>
                        <aside>
                            <p className={`${KICKER} mb-1.5 text-[10px] text-muted`}>{t('aboutSide')}</p>
                            <dl>
                                {ficha.map(([k, v]) => (
                                    <div key={k} className="border-t border-border py-3">
                                        <dt className={`${KICKER} text-[10px] text-muted`}>{k}</dt>
                                        <dd className="mt-1 text-[15px] font-bold leading-snug">{v}</dd>
                                    </div>
                                ))}
                            </dl>
                            {!semAnuncio && <div className="mt-5 hidden lg:block"><ProfileSidebarAd analyticsPlacement="group_lateral_fixa" /></div>}
                        </aside>
                    </div>
                </section>
            )}

            {/* Fandom */}
            {temFandom && (
                <section id="fandom" className="scroll-mt-28 border-t border-border py-10 sm:py-12">
                    <div className={`${COL} space-y-8`}>
                        <h2 className={H2}>{acf.fandom_name ? t('fandom', { fandom: acf.fandom_name }) : t('fandomPlain')}</h2>
                        {nodes.votacao}
                        {nodes.identidade}
                    </div>
                </section>
            )}

            {/* Leitura */}
            {relatedPosts.length > 0 && (
                <section id="ler" className="scroll-mt-28 border-t border-border py-10 sm:py-12">
                    <div className={COL}>{nodes.artigos}</div>
                </section>
            )}

            {relatedGroups.length > 0 && (
                <section className="border-t border-border py-10 sm:py-12">
                    <div className={COL}>{nodes.relacionados}</div>
                </section>
            )}

            {!semAnuncio && nodes.faq && <Anuncio placement="group_pre_faq" layout="leaderboard" />}
            {nodes.faq && <section className="border-t border-border py-10 sm:py-12"><div className={COL}>{nodes.faq}</div></section>}

            {resto.length > 0 && (
                <section className="border-t border-border py-8">
                    <div className={COL}>
                        <details>
                            <summary className="touch-target inline-flex h-11 cursor-pointer list-none items-center border px-5 text-[14px] font-bold" style={{ borderColor: accent, color: accent }}>{t('fullSheet')}</summary>
                            <div className="mt-6 space-y-10">{resto}</div>
                        </details>
                    </div>
                </section>
            )}
        </>
    )
}
