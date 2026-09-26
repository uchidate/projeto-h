import Link from 'next/link'
import { SITE_NAME } from '@/lib/constants/site'
import { BotaoTorcida } from '@/components/fandoms/EspacoDoFa'
import { contorno, tinta } from '@/lib/fandoms/cor'
import type { Fandom } from '@/lib/wordpress/fandoms'
import { toMemberSummary } from '@/lib/artists/memberSummary'
import type { WPArtist } from '@/lib/wordpress/types'
import { stripHtml } from '@/lib/utils'
import { SITE_URL } from '@/lib/constants/site'
import { JsonLd } from '@/components/seo/JsonLd'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import Image from 'next/image'
import { getPosts } from '@/lib/wordpress/posts'
import { QuizFacts } from '@/components/ui/QuizFacts'
import { GroupMemberCard } from '@/components/groups/GroupMemberCard'
import { FandomGroupCard } from '@/components/fandoms/FandomGroupCard'
import { FandomSidebarFicha } from '@/components/fandoms/FandomSidebarFicha'
import { EntityFAQ, type EntityFAQItem } from '@/components/seo/EntityFAQ'

const SITE_ACCENT = '#e91e8c'

interface Props {
    fandom: Fandom
    artists: WPArtist[]
}

const TITULO = 'font-[family-name:var(--font-playfair)] text-[28px] font-extrabold leading-tight sm:text-[34px]'

/** Últimos artigos que citam o grupo principal da torcida. Some se não houver nenhum. */
async function NovidadesDaTorcida({ grupoSlug, nome, cor, ink }: { grupoSlug: string; nome: string; cor: string; ink: string }) {
    const { items } = await getPosts({ mentionsType: 'group', mentionsSlug: grupoSlug, perPage: 3, includeContent: false }).catch(() => ({ items: [] }))
    if (items.length === 0) return null
    return (
        <section id="novidades">
            <h2 className={TITULO}>Novidades da torcida 🔥</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {items.map(p => (
                    <Link key={p.id} href={`/blog/${p.slug}`} className="group flex flex-col border-2 border-border bg-surface transition-transform hover:-translate-y-0.5">
                        <span className="relative block aspect-[16/10] overflow-hidden bg-background">
                            {p.featured_image_url && <Image src={p.featured_image_url} alt="" fill sizes="(min-width: 640px) 320px, 100vw" className="object-cover object-top" />}
                            <span className="absolute left-2 top-2 px-2 py-0.5 text-[11px] font-black" style={{ background: cor, color: ink }}>{nome}</span>
                        </span>
                        <span className="block p-3.5 text-[16px] font-bold leading-snug group-hover:underline">{stripHtml(p.title.rendered)}</span>
                    </Link>
                ))}
            </div>
        </section>
    )
}

export function FandomDetailPage({ fandom, artists }: Props) {
    const { name, color, lightstick, groups } = fandom
    const accent = color ?? SITE_ACCENT
    const ink = tinta(accent)
    const fandomUrl = `${SITE_URL}/fandoms/${fandom.slug}`

    const faqItems: EntityFAQItem[] = [
        {
            question: `Quem faz parte do fandom ${name}?`,
            answer: `${name} é o fandom de ${groups.map(g => stripHtml(g.title.rendered)).join(', ')} no ${SITE_NAME}.`,
        },
        lightstick
            ? {
                question: `Qual é o lightstick oficial do ${name}?`,
                answer: `O lightstick oficial ligado ao fandom ${name} é o ${lightstick}.`,
            }
            : null,
    ].filter(Boolean) as EntityFAQItem[]

    return (
        <>
            <h1 className="sr-only">{name}</h1>
            <JsonLd
                data={{
                    '@context': 'https://schema.org',
                    '@type': 'Organization',
                    name,
                    url: fandomUrl,
                }}
            />

            <div className={`${contorno(accent)}`} style={{ background: accent, color: ink }}>
                <div className="page-wrap py-8 sm:py-12">
                    <p className="text-[12px] font-black uppercase tracking-[0.1em]">Torcida · {groups.map(g => stripHtml(g.title.rendered)).slice(0, 3).join(', ')}</p>
                    <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-[64px] font-extrabold leading-[0.95] sm:text-[112px]">{name}</h2>
                    <div className="mt-5 flex flex-wrap items-center gap-2.5">
                        <span className="bg-[#15102b] px-3 py-1.5 text-[12px] font-black text-white">{groups.length} grupo{groups.length !== 1 ? 's' : ''}</span>
                        {artists.length > 0 && <span className="bg-[#15102b] px-3 py-1.5 text-[12px] font-black text-white">{artists.length} artistas</span>}
                        {lightstick && <span className="bg-[#ffe14d] px-3 py-1.5 text-[12px] font-black text-[#15102b]">💡 {lightstick}</span>}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <BotaoTorcida slug={fandom.slug} ink={ink} cor={accent} />
                        <Link href="/quiz" className="touch-target inline-flex items-center bg-[#ffe14d] px-5 py-3 text-[14px] font-black text-[#15102b]">Fazer o quiz 🎯</Link>
                    </div>
                </div>
            </div>

            <div className="page-wrap py-8 lg:py-12">
                <div className="flex gap-10 items-start">
                    <div className="min-w-0 flex-1 space-y-12">
                        {groups[0] && <NovidadesDaTorcida grupoSlug={groups[0].slug} nome={name} cor={accent} ink={ink} />}

                        <section id="grupos">
                            <h2 className={TITULO}>{groups.length === 1 ? 'O grupo da torcida' : `Os ${groups.length} grupos da torcida`}</h2>
                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                {groups.map(group => <FandomGroupCard key={group.id} group={group} cor={accent} tinta={ink} />)}
                            </div>
                        </section>

                        {ADSENSE.slots.inline && <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="fandom_profile_feed" />}

                        {artists.length > 0 && (
                            <section id="artistas">
                                <h2 className={`${TITULO} mb-5`}>Quem a torcida ama · {artists.length}</h2>
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                    {artists.map(artist => (
                                        <GroupMemberCard key={artist.id} member={toMemberSummary(artist)} accent={accent} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {groups[0] && <div className="-mx-4 sm:mx-0"><QuizFacts entityId={groups[0].id} entitySlug={groups[0].slug} entityType="group" entityName={stripHtml(groups[0].title.rendered)} /></div>}

                        <EntityFAQ items={faqItems} title={`Perguntas rápidas sobre ${name}`} />
                    </div>

                    <FandomSidebarFicha
                        color={color}
                        lightstick={lightstick}
                        groupCount={groups.length}
                        artistCount={artists.length}
                        accent={accent}
                    />
                </div>
            </div>
        </>
    )
}
