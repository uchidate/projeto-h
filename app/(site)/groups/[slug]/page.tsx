import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { getGroups } from '@/lib/wordpress/groups'
import type { GroupsQuery } from '@/lib/wordpress/groups'
import { SITE_URL, buildOgImageUrl } from '@/lib/constants/site'
import { stripHtml, getWPImage, getYear } from '@/lib/utils'
import { JsonLd } from '@/components/seo/JsonLd'

import { GroupRoute, buildGroupMetadata } from '@/components/features/GroupRoute'
// 6h (era 600s). O `s-maxage` da borda vem daqui, e com 600s a cauda longa quase nunca
// acertava o cache (3 de 40 páginas, 2026-09-24; miss custa 0,8 a 2,2s contra 0,2s).
// Seguro porque `/api/revalidate` expurga a cópia da borda deste item (lib/cloudflare-purge.ts).
// Mudança feita por script SEM passar por essa rota só aparece na borda em até 6h:
// use o skill revalidar-cache depois de alteração programática.
export const revalidate = 21600

type Params = Promise<{ slug: string }>

// ── Páginas SEO por tipo ────────────────────────────────────────────────────

interface TipoConfig {
    label: string
    labelPlural: string
    description: string
    metaDesc: string
    intro: string
    query: GroupsQuery
}

const TIPO_CONFIGS: Record<string, TipoConfig> = {
    'girl-groups': {
        label: 'Girl Group',
        labelPlural: 'Girl Groups K-Pop',
        description: 'Os maiores girl groups do K-Pop — BLACKPINK, TWICE, aespa e muito mais.',
        metaDesc: 'Conheça todos os girl groups K-Pop: integrantes, estreia, fandom e curiosidades em português.',
        intro: 'Os girl groups são o coração do K-Pop. Com coreografias impecáveis, conceitos visuais únicos e fandoms apaixonados, esses grupos definiram a era moderna do pop coreano. Conheça todas as girl groups do nosso catálogo.',
        query: { type: 'girl_group', perPage: 100, orderby: 'popularity', order: 'desc' },
    },
    'boy-groups': {
        label: 'Boy Group',
        labelPlural: 'Boy Groups K-Pop',
        description: 'Os maiores boy groups do K-Pop — BTS, EXO, SEVENTEEN, Stray Kids e muito mais.',
        metaDesc: 'Conheça todos os boy groups K-Pop: integrantes, estreia, fandom e curiosidades em português.',
        intro: 'Os boy groups K-Pop conquistaram o mundo com performances épicas, produções musicais inovadoras e conexão única com os fãs. De BTS a Stray Kids, conheça os grupos mais importantes do gênero.',
        query: { type: 'boy_group', perPage: 100, orderby: 'popularity', order: 'desc' },
    },
    'grupos-mistos': {
        label: 'Grupo Misto',
        labelPlural: 'Grupos Mistos K-Pop',
        description: 'Co-ed groups do K-Pop — grupos com membros masculinos e femininos.',
        metaDesc: 'Conheça os co-ed groups do K-Pop: grupos mistos com membros masculinos e femininos.',
        intro: 'Os grupos mistos (co-ed) são uma raridade no K-Pop, mas têm uma história rica e fãs dedicados. Conheça todos os grupos com integrantes masculinos e femininos do nosso catálogo.',
        query: { type: 'co_ed', perPage: 100, orderby: 'popularity', order: 'desc' },
    },
    'solos': {
        label: 'Artista Solo',
        labelPlural: 'Artistas Solo K-Pop',
        description: 'Os principais artistas solo do K-Pop e K-R&B.',
        metaDesc: 'Conheça os artistas solo do K-Pop: cantores, rappers e artistas independentes da Coreia do Sul.',
        intro: 'Além dos grupos, o K-Pop tem uma cena solo vibrante. De IU a Zico, passando por artistas de R&B, hip-hop e pop, o cenário solo coreano é tão rico quanto o dos grupos. Conheça os principais nomes.',
        query: { type: 'solo', perPage: 100, orderby: 'popularity', order: 'desc' },
    },
}

// ── Static params ───────────────────────────────────────────────────────────

export async function generateStaticParams() {
    const tipoSlugs = Object.keys(TIPO_CONFIGS).map(t => ({ slug: t }))
    try {
        const { items, totalPages } = await getGroups({ perPage: 100, orderby: 'date' })
        const groupSlugs = items.map(g => ({ slug: g.slug }))
        // Fetch remaining pages if total > 100
        if (totalPages > 1) {
            for (let page = 2; page <= totalPages; page++) {
                const { items: moreItems } = await getGroups({ page, perPage: 100, orderby: 'date' })
                groupSlugs.push(...moreItems.map(g => ({ slug: g.slug })))
            }
        }
        return [...tipoSlugs, ...groupSlugs]
    } catch {
        return tipoSlugs
    }
}

// ── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { slug } = await params

    const tipoConfig = TIPO_CONFIGS[slug]
    if (tipoConfig) {
        const url = `${SITE_URL}/groups/${slug}`
        const ogImage = buildOgImageUrl({ title: tipoConfig.labelPlural, subtitle: tipoConfig.metaDesc, type: 'group' })
        return {
            title: tipoConfig.labelPlural,
            description: tipoConfig.metaDesc,
            alternates: { canonical: url },
            openGraph: {
                title: tipoConfig.labelPlural,
                description: tipoConfig.metaDesc,
                url,
                type: 'website',
                images: [{ url: ogImage, width: 1200, height: 630 }],
            },
            twitter: {
                card: 'summary_large_image',
                title: tipoConfig.labelPlural,
                description: tipoConfig.metaDesc,
                images: [ogImage],
            },
        }
    }

    return buildGroupMetadata(slug, 'pt')
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function GroupPage({ params }: { params: Params }) {
    const { slug } = await params

    // Rota SEO por tipo (girl-groups, boy-groups, grupos-mistos, solos)
    const tipoConfig = TIPO_CONFIGS[slug]
    if (tipoConfig) {
        const { items: groups } = await getGroups(tipoConfig.query)
        const pageUrl = `${SITE_URL}/groups/${slug}`

        return (
            <>
                <JsonLd data={{
                    '@context': 'https://schema.org',
                    '@type': 'CollectionPage',
                    name: tipoConfig.labelPlural,
                    url: pageUrl,
                    description: tipoConfig.description,
                }} />

                <div className="border-b border-border/40">
                    <div className="page-wrap py-6 sm:py-10">
                        <div className="mt-4">
                            <p className="font-mono text-[11px] text-muted uppercase tracking-[0.06em] mb-1">K-Pop</p>
                            <h1 className="text-[28px] sm:text-[40px] font-black tracking-[-0.03em] leading-tight">
                                {tipoConfig.labelPlural}
                            </h1>
                            <p className="text-[14px] leading-relaxed text-foreground/70 mt-3 max-w-2xl">{tipoConfig.intro}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-5">
                            <span className="font-mono text-[11px] text-muted">
                                {groups.length} grupo{groups.length !== 1 ? 's' : ''}
                            </span>
                            <span className="text-muted/30">·</span>
                            {Object.entries(TIPO_CONFIGS).map(([key, c]) => (
                                <Link key={key} href={`/groups/${key}`}
                                    className={`font-mono text-[11px] transition-colors ${key === slug ? 'text-accent font-bold' : 'text-muted hover:text-foreground'}`}>
                                    {c.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="page-wrap py-8">
                    {groups.length === 0 ? (
                        <div className="flex flex-col items-center py-20 text-center">
                            <Users size={48} className="text-muted/20 mb-4" />
                            <p className="text-[16px] font-bold mb-1">Nenhum grupo encontrado</p>
                            <p className="text-[13px] text-muted mb-4">Ainda não temos grupos nesta categoria.</p>
                            <Link href="/groups" className="text-[13px] font-semibold text-accent hover:underline">
                                ← Ver todos os grupos
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {groups.map(group => {
                                const img = getWPImage(group._embedded, group.featured_image_url)
                                const name = stripHtml(group.title.rendered)
                                const acf = group.acf ?? {}
                                const debutYear = getYear(acf.debut_date)
                                const isActive = acf.active !== false
                                return (
                                    <Link key={group.id} href={`/groups/${group.slug}`}
                                        className="group flex flex-col items-center text-center p-3 rounded-xl border border-border hover:border-accent transition-colors bg-background hover:bg-surface/60">
                                        <div className="relative w-20 h-20 mb-3 overflow-hidden rounded-full bg-surface ring-1 ring-border group-hover:ring-accent transition-colors"
                                            style={acf.color ? { boxShadow: `0 0 0 2px ${acf.color}22` } : undefined}>
                                            {img ? (
                                                <Image src={img.src} alt={name} fill
                                                    className="object-cover group-hover:scale-[1.05] transition-transform duration-500"
                                                    sizes="80px" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-accent/10">
                                                    <span className="text-[24px] font-black text-accent/30">{name[0]}</span>
                                                </div>
                                            )}
                                            {!isActive && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <span className="font-mono text-[8px] font-bold text-white/80 uppercase">Inativo</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[13px] font-bold leading-tight group-hover:text-accent transition-colors line-clamp-2">{name}</p>
                                        {acf.name_hangul && (
                                            <p className="text-[10px] text-muted mt-0.5">{acf.name_hangul}</p>
                                        )}
                                        {debutYear && (
                                            <p className="font-mono text-[10px] text-muted/60 mt-1">Est. {debutYear}</p>
                                        )}
                                        {acf.fandom_name && (
                                            <p className="font-mono text-[9px] text-accent/70 mt-0.5">{acf.fandom_name}</p>
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    )}

                    <div className="mt-10 pt-6 border-t border-border">
                        <Link href="/groups" className="font-mono text-[12px] font-semibold text-muted hover:text-foreground transition-colors">
                            ← Ver todos os grupos
                        </Link>
                    </div>
                </div>
            </>
        )
    }

    return <GroupRoute slug={slug} locale="pt" />
}
