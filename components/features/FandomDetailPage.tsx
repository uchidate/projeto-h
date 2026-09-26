import Link from 'next/link'
import { SITE_NAME } from '@/lib/constants/site'
import { BotaoTorcida } from '@/components/fandoms/EspacoDoFa'
import { contorno, tinta } from '@/lib/fandoms/cor'
import { proximasDatas } from '@/lib/fandoms/datas'
import { chaveDia } from '@/lib/quiz/dia'
import type { Fandom } from '@/lib/wordpress/fandoms'
import type { WPArtist } from '@/lib/wordpress/types'
import { getWPImage, getYear, stripHtml } from '@/lib/utils'
import { SITE_URL } from '@/lib/constants/site'
import { JsonLd } from '@/components/seo/JsonLd'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import Image from 'next/image'
import { getPosts } from '@/lib/wordpress/posts'
import { QuizFacts } from '@/components/ui/QuizFacts'
import { FandomGroupCard } from '@/components/fandoms/FandomGroupCard'
import { FandomSidebarFicha } from '@/components/fandoms/FandomSidebarFicha'
import { NomeDaTorcida } from '@/components/fandoms/EnriquecerTorcida'
import { OutrasTorcidas, type TorcidaVizinha } from '@/components/fandoms/OutrasTorcidas'
import { EntityFAQ, type EntityFAQItem } from '@/components/seo/EntityFAQ'

const SITE_ACCENT = '#e91e8c'

interface Props {
    fandom: Fandom
    artists: WPArtist[]
    outras: TorcidaVizinha[]
}

/** Próximas datas que a torcida comemora (estreia do grupo e aniversário dos membros), a partir dos dados do site. */
function DatasDaTorcida({ groups, artists, cor, ink }: { groups: Fandom['groups']; artists: WPArtist[]; cor: string; ink: string }) {
    const datas = proximasDatas(
        groups.map(g => ({ nome: stripHtml(g.title.rendered), data: g.acf?.debut_date, encerrado: g.acf?.active === false })),
        artists.map(a => ({ nome: stripHtml(a.title.rendered), data: a.acf?.birth_date, encerrado: !!a.acf?.death_date })),
        chaveDia(),
    )
    if (datas.length === 0) return null
    return (
        <section aria-labelledby="datas-titulo">
            <h2 id="datas-titulo" className={TITULO}>Próximas datas 🎂</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {datas.map(d => (
                    <li key={`${d.tipo}-${d.quem}`} className="flex items-center gap-4 border-2 border-border bg-surface p-4">
                        <span className="flex w-[64px] shrink-0 flex-col items-center justify-center py-1.5" style={{ background: cor, color: ink }}>
                            <span className="text-[20px] font-black leading-none">{d.dia}</span>
                            <span className="mt-0.5 text-[10px] font-black uppercase">{d.dias === 0 ? 'hoje' : d.dias === 1 ? 'amanhã' : `em ${d.dias} d`}</span>
                        </span>
                        <span className="text-[15px] font-bold leading-snug">
                            {d.tipo === 'estreia' ? `${d.quem} completa ${d.anos} ${d.anos === 1 ? 'ano' : 'anos'} de estreia` : `${d.quem} faz ${d.anos} anos`}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    )
}

const TITULO = 'font-[family-name:var(--font-playfair)] text-[28px] font-extrabold leading-tight sm:text-[34px]'

/** Últimos artigos que citam o grupo principal da torcida. Some se não houver nenhum. */
async function NovidadesDaTorcida({ grupoSlugs, nome, cor, ink }: { grupoSlugs: string[]; nome: string; cor: string; ink: string }) {
    // Até 3 grupos da torcida; junta, tira repetidos e fica com os 3 mais recentes.
    const listas = await Promise.all(grupoSlugs.slice(0, 3).map(slug => getPosts({ mentionsType: 'group', mentionsSlug: slug, perPage: 3, includeContent: false }).then(r => r.items).catch(() => [])))
    const items = Array.from(new Map(listas.flat().map(p => [p.id, p])).values()).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)
    if (items.length === 0) return null
    return (
        <section id="novidades">
            <h2 className={TITULO}>Novidades da torcida 🔥</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {items.map(p => (
                    <Link key={p.id} href={`/blog/${p.slug}`} className="group flex flex-col border-2 border-border bg-surface transition-transform hover:-translate-y-0.5">
                        <span className="relative block aspect-[16/10] overflow-hidden bg-background">
                            {p.featured_image_url && <Image src={p.featured_image_url} alt={stripHtml(p.title.rendered)} fill sizes="(min-width: 640px) 320px, 100vw" className="object-cover object-top" />}
                            <span className="absolute left-2 top-2 px-2 py-0.5 text-[11px] font-black" style={{ background: cor, color: ink }}>{nome}</span>
                        </span>
                        <span className="block p-3.5 text-[16px] font-bold leading-snug group-hover:underline">{stripHtml(p.title.rendered)}</span>
                    </Link>
                ))}
            </div>
        </section>
    )
}

export function FandomDetailPage({ fandom, artists, outras }: Props) {
    const { name, color, lightstick, groups } = fandom
    const accent = color ?? SITE_ACCENT
    const ink = tinta(accent)
    const fandomUrl = `${SITE_URL}/fandoms/${fandom.slug}`

    const nomesGrupos = groups.map(g => stripHtml(g.title.rendered))
    const estreias = groups.map(g => getYear(g.acf?.debut_date)).filter((a): a is number => !!a)
    // A história do nome vem das curiosidades do grupo que citam a torcida; sem ela, a pergunta não entra.
    const historiaDoNome = groups.flatMap(g => (Array.isArray(g.acf?.curiosidades) ? g.acf.curiosidades : [])).find(c => typeof c === 'string' && c.toLowerCase().includes(name.toLowerCase()))

    const faqItems: EntityFAQItem[] = [
        {
            question: `Quem faz parte do fandom ${name}?`,
            answer: `${name} é o fandom de ${nomesGrupos.join(', ')} no ${SITE_NAME}.`,
        },
        historiaDoNome
            ? { question: `Por que o fandom se chama ${name}?`, answer: historiaDoNome }
            : null,
        estreias.length > 0
            ? {
                question: `Desde quando existe a torcida ${name}?`,
                answer: `A torcida acompanha ${nomesGrupos[0]}, que estreou em ${Math.min(...estreias)}${estreias.length > 1 ? ` (o primeiro dos ${nomesGrupos.length} grupos da torcida)` : ''}.`,
            }
            : null,
        lightstick
            ? {
                question: `Qual é o lightstick oficial do ${name}?`,
                answer: `O lightstick oficial ligado ao fandom ${name} é o ${lightstick}.`,
            }
            : null,
    ].filter(Boolean) as EntityFAQItem[]

    return (
        <>
            <h1 className="sr-only">Fandom {name}: a torcida {groups.length > 1 ? 'dos grupos' : 'do grupo'} {groups.map(g => stripHtml(g.title.rendered)).join(', ')}</h1>
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
                        {groups[0] && <NovidadesDaTorcida grupoSlugs={groups.map(g => g.slug)} nome={name} cor={accent} ink={ink} />}

                        <DatasDaTorcida groups={groups} artists={artists} cor={accent} ink={ink} />

                        <section id="grupos">
                            <h2 className={TITULO}>{groups.length === 1 ? 'O grupo da torcida' : `Os ${groups.length} grupos da torcida`}</h2>
                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                {groups.map(group => <FandomGroupCard key={group.id} group={group} cor={accent} tinta={ink} />)}
                            </div>
                        </section>

                        {groups[0] && <NomeDaTorcida grupos={groups} nome={name} cor={accent} ink={ink} />}

                        {ADSENSE.slots.inline && <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="fandom_profile_feed" />}

                        {artists.length > 0 && (
                            <section id="artistas" aria-labelledby="artistas-titulo">
                                <h2 id="artistas-titulo" className={TITULO}>Quem a torcida ama</h2>
                                <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-4">
                                    {artists.map(artist => {
                                        const img = getWPImage(artist._embedded, artist.featured_image_url)
                                        const nome = stripHtml(artist.title.rendered)
                                        return (
                                            <li key={artist.id}>
                                                <Link href={`/artists/${artist.slug}`} className="group flex w-[76px] flex-col items-center gap-1.5 text-center">
                                                    <span className="relative h-[68px] w-[68px] overflow-hidden rounded-full bg-surface ring-2 transition-transform group-hover:scale-105" style={{ ['--tw-ring-color' as string]: accent }}>
                                                        {img && <Image src={img.src} alt={`Foto de ${nome}, artista da torcida ${name}`} fill sizes="68px" className="object-cover object-top" />}
                                                    </span>
                                                    <span className="text-[12px] font-bold leading-tight group-hover:underline">{nome}</span>
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </section>
                        )}

                        {groups[0] && <div className="-mx-4 sm:mx-0"><QuizFacts entityId={groups[0].id} entitySlug={groups[0].slug} entityType="group" entityName={stripHtml(groups[0].title.rendered)} /></div>}

                        <div className="xl:hidden"><OutrasTorcidas torcidas={outras} /></div>

                        <EntityFAQ items={faqItems} title={`Perguntas rápidas sobre ${name}`} />
                    </div>

                    <FandomSidebarFicha lightstick={lightstick} outras={outras} />
                </div>
            </div>
        </>
    )
}
