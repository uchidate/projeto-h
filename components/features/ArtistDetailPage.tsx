import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { href } from '@/lib/i18n/routes'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import type { WPArtist, WPProduction, WPGroup, WPPost, WPAgency } from '@/lib/wordpress/types'
import type { ArchiveHub } from '@/lib/guias/types'
import { getWPImage, stripHtml, formatDate } from '@/lib/utils'
import { alturaSchema, generoSchema, juntarSameAs, urlWikipedia } from '@/lib/seo/entidade'
import { SITE_URL } from '@/lib/constants/site'
import { JsonLd } from '@/components/seo/JsonLd'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import type { DiscographyAlbum } from '@/components/groups/GroupDiscography'
import { toIsoDateString } from '@/lib/utils'
import { intlLocale } from '@/lib/i18n/format'
import { localizePlace, placeWithPreposition } from '@/lib/i18n/place'
import { firstSentence } from '@/lib/seo/firstSentence'
import { alternateNames, performerIn } from '@/lib/seo/person'
import { ReadingBar } from '@/components/ui/ReadingBar'
import { QuizWidget } from '@/components/ui/QuizWidget'
import { QuizFacts } from '@/components/ui/QuizFacts'
import { buildArtistProfileModel } from '@/lib/profiles/artistProfile'
import { ArtistHero } from '@/components/artists/ArtistHero'
import { ArtistColophon } from '@/components/artists/ArtistColophon'
import { ArtistNextRead } from '@/components/artists/ArtistNextRead'
import type { EntityFAQItem } from '@/components/seo/EntityFAQ'
import { renderProfileEntries, isInterstitial, CHAVE_DE_ANUNCIO, type ProfileEntry } from '@/components/profiles/ProfileSection'
import { variantePorId } from '@/lib/experimento'
import { fichaMagra } from '@/lib/artists/fichaMagra'
import { reordenarPorAba, limitarAnuncios, abasDasAncoras } from '@/lib/artists/fichaC'
import { ArtistAtalhos } from '@/components/artists/ArtistAtalhos'
import { ArtistObrasFaixa } from '@/components/artists/ArtistObrasFaixa'
import { ArtistAbas } from '@/components/artists/ArtistAbas'
import { buildArtistProfileEntries } from '@/components/profiles/ArtistProfileBlocks'
import { ProfileProseStyles } from '@/components/profiles/ProfileProseStyles'

interface Props {
    artist: WPArtist
    productions?: WPProduction[]
    groups?: WPGroup[]
    relatedPosts?: WPPost[]
    agency?: WPAgency
    relatedArtists?: WPArtist[]
    connectionGroup?: WPGroup
    discography?: DiscographyAlbum[]
    relatedHubs?: ArchiveHub[]
    categoryMap?: Record<number, { name: string; slug: string }>
}


export function ArtistDetailPage({
    artist,
    productions = [],
    groups = [],
    relatedPosts = [],
    agency,
    relatedArtists = [],
    connectionGroup,
    discography = [],
    relatedHubs = [],
    categoryMap,
}: Props) {
    const t = useTranslations('profile')
    const tEntity = useTranslations('entity')
    const tC = useTranslations('profile.artistC')
    const locale = useLocale()
    const model = buildArtistProfileModel(artist, undefined, locale)
    const {
        name, acf, age, roleLabels, socialEntries, heroCopy, heroMeta, quickFacts, accent,
        storyChapters, hasStoryChapters,
    } = model
    const image = getWPImage(artist._embedded, artist.featured_image_url)
    const artistUrl = `${SITE_URL}${href('artist', { slug: artist.slug }, locale)}`

    const primaryGroupName = groups.length > 0 ? stripHtml(groups[0].title.rendered) : null
    const agencyName = agency ? stripHtml(agency.title.rendered) : null
    const latestChapter = hasStoryChapters ? storyChapters[storyChapters.length - 1] : null
    const birthPlace = localizePlace(acf.birth_place, locale)
    const bioLead = firstSentence(stripHtml(artist.content.rendered))
    const faqItems = [
        {
            // A primeira frase da bio responde "quem é" de verdade. O texto
            // genérico ("aparece no site em um perfil...") virava a resposta
            // do FAQPage no JSON-LD e não respondia nada.
            question: t('artist.faq.whoQ', { name }),
            answer: bioLead || t('artist.faq.whoA', {
                name,
                extra: (roleLabels.length > 0 ? t('artist.faq.whoARoles', { roles: roleLabels.join(', ') }) : '')
                    + (primaryGroupName ? t('artist.faq.whoAGroup', { group: primaryGroupName }) : ''),
            }),
        },
        // Pergunta que as buscas fazem ("fulana nasceu onde", "é de qual país"),
        // no lugar de "Quais recordes...", cuja resposta era a métrica crua.
        birthPlace
            ? {
                question: t('artist.faq.birthPlaceQ', { name }),
                answer: t('artist.faq.birthPlaceA', { name, place: placeWithPreposition(birthPlace, locale) }),
            }
            : null,
        latestChapter
            ? {
                question: t('artist.faq.latestQ', { name }),
                answer: t('artist.faq.latestA', { period: latestChapter.period, title: latestChapter.title, description: latestChapter.description }),
            }
            : null,
        acf.birth_date
            ? {
                question: t('artist.faq.birthQ', { name }),
                answer: acf.death_date
                    ? t('artist.faq.birthDeathA', {
                        name,
                        birth: formatDate(acf.birth_date, intlLocale(locale)),
                        death: formatDate(acf.death_date, intlLocale(locale)),
                        age: age != null ? t('artist.faq.ageAtDeath', { age }) : '',
                    })
                    : t('artist.faq.birthA', {
                        name,
                        birth: formatDate(acf.birth_date, intlLocale(locale)),
                        age: age != null ? t('artist.faq.ageNow', { age }) : '',
                    }),
            }
            : null,
        primaryGroupName
            ? {
                question: t('artist.faq.groupQ', { name }),
                answer: t('artist.faq.groupA', { name, groups: groups.map(group => stripHtml(group.title.rendered)).join(', ') }),
            }
            : null,
        agencyName
            ? {
                question: t('artist.faq.agencyQ', { name }),
                answer: t('artist.faq.agencyA', { name, agency: agencyName }),
            }
            : null,
        productions.length > 0
            ? {
                question: t('artist.faq.filmographyQ', { name }),
                answer: t('artist.faq.filmographyA', { name, count: productions.length }),
            }
            : null,
    ].filter(Boolean).slice(0, 6) as EntityFAQItem[]

    // Teste A/B por id (par = ficha "C"), a mesma regra das produções. A C reordena a
    // ficha em seis grupos (visão, carreira, música, obras, universo, ler), põe atalhos
    // por intenção no topo, troca as âncoras por seis abas e limita a três anúncios.
    // O texto indexável é o mesmo.
    const variante = variantePorId(artist.id)
    const emC = variante === 'b'
    const magra = fichaMagra({
        hasStoryChapters, hasAnalysis: !!model.editorialAnalysis, productions: productions.length,
        bioChars: stripHtml(artist.content.rendered).length,
    })
    let entries: ProfileEntry[] = buildArtistProfileEntries({
        model, productions, groups, discography, relatedArtists, relatedPosts,
        agency, connectionGroup, faqItems, categoryMap, portrait: image, t,
        semAnuncio: magra,
    })
    // Vale para as duas variantes: ficha magra não carrega anúncio (risco de "conteúdo de baixo valor").
    if (magra) entries = entries.filter(e => !(isInterstitial(e) && CHAVE_DE_ANUNCIO.test(e.key)))
    if (emC) entries = limitarAnuncios(reordenarPorAba(entries), 3)
    if (emC) entries = entries.map(e => !isInterstitial(e) && e.id === 'filmografia'
        ? { ...e, render: (label: string) => <><ArtistObrasFaixa productions={productions} accent={accent} />{e.render(label)}</> }
        : e)
    const presentes = new Set(entries.filter(e => !isInterstitial(e) && e.present).map(e => (e as { id: string }).id))
    const detalhes: Record<string, string | undefined> = {
        musica: discography[0]?.title,
        filmografia: productions[0] ? stripHtml(productions[0].title.rendered) : undefined,
        artigos: relatedPosts[0] ? stripHtml(relatedPosts[0].title.rendered) : undefined,
        trajetoria: storyChapters.length > 0 ? tC('understandDetail', { count: storyChapters.length }) : undefined,
    }
    const atalhos = emC ? ([
        { id: 'musica', tipo: 'listen' }, { id: 'filmografia', tipo: 'watch' },
        { id: 'artigos', tipo: 'read' }, { id: 'trajetoria', tipo: 'understand' },
    ] as const).filter(d => presentes.has(d.id) && (d.id !== 'musica' || discography.length > 0)).map(d => ({ ...d, detalhe: detalhes[d.id] })) : []

    const { anchors: todasAncoras, nodes: sectionNodes } = renderProfileEntries(entries, { medir: { prefixo: 'ficha-artista', ids: ['filmografia', 'grupos', 'relacionados', 'artigos'] } })
    const pageAnchors = emC
        ? abasDasAncoras(todasAncoras.map(a => a.href.slice(1)), aba => tC(`tabs.${aba}`))
        : todasAncoras

    return (
        <>
            <JsonLd data={{
                '@context': 'https://schema.org', '@type': 'Person',
                name, alternateName: alternateNames(name, acf.name_hangul), url: artistUrl,
                image: image ? { '@type': 'ImageObject', url: image.src } : undefined,
                birthDate: toIsoDateString(acf.birth_date), deathDate: toIsoDateString(acf.death_date),
                // Sem `nationality`: era 'Korean' fixo para todos, inclusive
                // artistas filipinas, japonesas e tailandesas. Nenhum campo real o sustenta.
                birthPlace: acf.birth_place,
                jobTitle: roleLabels.join(', ') || undefined,
                memberOf: groups.length > 0
                    ? groups.map(g => ({ '@type': 'MusicGroup', name: stripHtml(g.title.rendered), url: `${SITE_URL}${href('group', { slug: g.slug }, locale)}` }))
                    : undefined,
                // Wikipedia primeiro: é a referência que o Google usa para
                // desambiguar a pessoa no Knowledge Graph (ver lib/seo/entidade.ts).
                sameAs: juntarSameAs([urlWikipedia(acf.wikipedia_title, artist.content.rendered)], socialEntries.map(s => s.url)),
                // Filmografia no schema: a busca dominante por artista é "<nome> filmes e programas de tv".
                performerIn: performerIn(productions, slug => `${SITE_URL}${href('production', { slug }, locale)}`),
                gender: generoSchema(acf.gender),
                height: alturaSchema(acf.height),
                affiliation: agencyName ? { '@type': 'Organization', name: agencyName } : undefined,
                description: stripHtml(artist.content.rendered).slice(0, 200) || undefined,
            }} />
            <ProfileProseStyles scope="artist-bio" accent={accent} />
            <JsonLd data={{
                '@context': 'https://schema.org', '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: tEntity('breadcrumb.artists'), item: `${SITE_URL}${href('artists', undefined, locale)}` },
                    { '@type': 'ListItem', position: 2, name, item: artistUrl },
                ],
            }} />


            <ReadingBar backHref={href('artists', undefined, locale)} backLabel={tEntity('breadcrumb.artists')} tagLabel={roleLabels[0]} title={name} pageUrl={artistUrl} pageAnchors={pageAnchors} />

            <div hidden data-variante={emC ? 'artista-c' : 'artista-a'} />
            <ArtistHero
                artist={artist} name={name} artistUrl={artistUrl} image={image}
                roleLabels={roleLabels} groups={groups} agency={agency}
                heroMeta={heroMeta} heroCopy={heroCopy} quickFacts={quickFacts} accent={accent}
            />
            {emC && <ArtistAbas abas={pageAnchors} accent={accent} />}
            {emC && <ArtistAtalhos destinos={[...atalhos]} accent={accent} />}

            {sectionNodes}

            {/* Guias só existem em português. */}
            {locale === DEFAULT_LOCALE && relatedHubs.length > 0 && (
                <div className="page-wrap py-8 border-t border-border/40">
                    <div className="mb-4">
                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">{t('explore')}</p>
                        <h2 className="text-[18px] font-black tracking-[-0.03em]">{t('relatedGuides')}</h2>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {relatedHubs.map(hub => (
                            <Link key={hub.slug} href={`/guias/${hub.slug}`}
                                className="touch-target border border-border bg-surface p-4 transition-colors hover:border-accent/60 hover:bg-accent/5">
                                <h3 className="text-[15px] font-black leading-snug text-foreground">{hub.shortTitle}</h3>
                                <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-muted">{hub.description}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <ArtistColophon artist={artist} name={name} accent={accent} />

            <QuizFacts entitySlug={artist.slug} entityType="artist" entityName={name} />
            <QuizWidget category="k-pop" />

            {relatedArtists.length > 0 ? (
                <ArtistNextRead artists={relatedArtists} connectionGroup={connectionGroup} agency={agency} accent={accent} />
            ) : (
                <div className="border-t border-border/40">
                    <div className="page-wrap py-6">
                        <div className="flex flex-wrap gap-4">
                            <Link href={href('artists', undefined, locale)} className="touch-target inline-flex items-center font-mono text-[12px] text-muted transition-colors hover:text-accent">{t('artist.allArtists')}</Link>
                            <Link href={href('groups', undefined, locale)} className="touch-target inline-flex items-center font-mono text-[12px] text-muted transition-colors hover:text-accent">{t('artist.kpopGroups')}</Link>
                        </div>
                    </div>
                </div>
            )}

            <ScrollToTop />
        </>
    )
}
