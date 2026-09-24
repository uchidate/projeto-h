import { SITE_NAME } from '@/lib/constants/site'
import { intlLocale } from '@/lib/i18n/format'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getCompanyBySlug, getCompanies, getRelatedCompanies, rotuloDoSetor, emojiDoSetor } from '@/lib/wordpress/companies'
import { SITE_URL } from '@/lib/constants/site'
import { stripHtml, getWPImage } from '@/lib/utils'
import { buildWordPressMetadata } from '@/lib/seo/wordpress'
import { buildBreadcrumbSchema, buildOrganizationSchema } from '@/lib/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLd'
import { WpEditSetter } from '@/components/ui/WpEditContext'
import { Globe, Users, Calendar, TrendingUp, AtSign } from 'lucide-react'
import { metaDescription } from '@/lib/seo/metaDescription'

export const revalidate = 600

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
    try {
        const { items, totalPages } = await getCompanies({ perPage: 100, orderby: 'date' })
        const slugs = items.map(c => ({ slug: c.slug }))
        if (totalPages > 1) {
            for (let p = 2; p <= totalPages; p++) {
                const { items: more } = await getCompanies({ page: p, perPage: 100 })
                slugs.push(...more.map(c => ({ slug: c.slug })))
            }
        }
        return slugs
    } catch { return [] }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { slug } = await params
    const company = await getCompanyBySlug(slug)
    if (!company) return {}

    const name = stripHtml(company.title.rendered)
    const korean = company.acf?.name_korean
    const industry = rotuloDoSetor(company.acf?.industry) ?? 'Empresa sul-coreana'
    // "CJ ENM (CJ ENM)": o nome coreano cadastrado às vezes repete o próprio nome.
    const showKorean = korean && !korean.toLowerCase().includes(name.toLowerCase())
    const title = `${name}${showKorean ? ` (${korean})` : ''} — ${industry}`
    const description = company.excerpt?.rendered
        ? metaDescription(stripHtml(company.excerpt.rendered))
        : `Tudo sobre ${name}: história, produtos, fundadores e muito mais.`
    const image = getWPImage(company._embedded, company.featured_image_url)
    const url = `${SITE_URL}/empresas/${slug}`

    return buildWordPressMetadata({ title, description, url, image })
}

export default async function CompanyPage({ params }: { params: Params }) {
    const { slug } = await params
    const company = await getCompanyBySlug(slug)
    if (!company) notFound()

    const acf = company.acf ?? {}
    const name = stripHtml(company.title.rendered)
    const img = getWPImage(company._embedded, company.featured_image_url)
    const indLabel = rotuloDoSetor(acf.industry)
    const indEmoji = emojiDoSetor(acf.industry)
    const companyUrl = `${SITE_URL}/empresas/${slug}`

    const relatedCompanies = await getRelatedCompanies(company.id, acf.industry, 6)

    // "Nome do produto|URL da imagem" — URL é opcional, mesmo padrão pipe-delimited de awards/milestones
    const products = (acf.famous_products ?? []).map(p => {
        const [prodName, prodImage] = p.split('|').map(s => s.trim())
        return { name: prodName, image: prodImage || null }
    })

    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: `${SITE_NAME}`, url: SITE_URL },
        { name: 'Empresas', url: `${SITE_URL}/empresas` },
        { name: name, url: companyUrl },
    ])

    const organizationSchema = buildOrganizationSchema({
        name,
        url: acf.website || companyUrl,
        logo: img?.src,
        description: company.excerpt?.rendered ? stripHtml(company.excerpt.rendered) : undefined,
        foundingDate: acf.founded_year,
        sameAs: [acf.website, acf.instagram].filter((v): v is string => Boolean(v)),
    })

    return (
        <>
            <WpEditSetter postId={company.id} postType="company" />
            <JsonLd data={breadcrumbSchema} />
            <JsonLd data={organizationSchema} />

            {/* Hero */}
            <div className="border-b border-border/40">
                <div className="page-wrap py-6 sm:py-10">
                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
                        {/* Logo */}
                        <div className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 rounded-2xl overflow-hidden bg-surface border border-border flex items-center justify-center">
                            {img ? (
                                <Image src={img.src} alt={name} fill className="object-contain p-3" sizes="144px" />
                            ) : (
                                <span className="text-[56px]">{indEmoji}</span>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            {indLabel && (
                                <p className="font-mono text-[11px] text-muted uppercase tracking-[0.06em] mb-2">
                                    {indEmoji} {indLabel}
                                    {acf.is_chaebol && <span className="ml-2 text-accent">· Chaebol</span>}
                                </p>
                            )}
                            <h1 className="text-[32px] sm:text-[44px] font-black tracking-[-0.03em] leading-none">{name}</h1>
                            {acf.name_korean && <p className="text-[20px] text-muted mt-1">{acf.name_korean}</p>}
                            {acf.name_romanized && acf.name_romanized !== name && (
                                <p className="font-mono text-[13px] text-muted/70 mt-0.5">{acf.name_romanized}</p>
                            )}
                            {company.excerpt?.rendered && (
                                <p className="text-[15px] leading-relaxed text-foreground/80 mt-4 max-w-xl"
                                    dangerouslySetInnerHTML={{ __html: company.excerpt.rendered }} />
                            )}

                            {/* Stats rápidos */}
                            <div className="flex flex-wrap gap-3 mt-5">
                                {acf.founded_year && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-surface font-mono text-[11px]">
                                        <Calendar size={12} className="text-muted" />
                                        <span className="text-muted">Fund. {acf.founded_year}</span>
                                    </span>
                                )}
                                {acf.employees && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-surface font-mono text-[11px]">
                                        <Users size={12} className="text-muted" />
                                        <span className="text-muted">{acf.employees.toLocaleString(intlLocale())} funcionários</span>
                                    </span>
                                )}
                                {acf.revenue && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-surface font-mono text-[11px]">
                                        <TrendingUp size={12} className="text-muted" />
                                        <span className="text-muted">{acf.revenue}</span>
                                    </span>
                                )}
                                {acf.headquarters && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-surface font-mono text-[11px]">
                                        <span className="text-muted">📍 {acf.headquarters}</span>
                                    </span>
                                )}
                                {acf.stock_ticker && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-surface font-mono text-[11px] text-muted">
                                        {acf.stock_ticker}
                                    </span>
                                )}
                                {acf.website && (
                                    <a href={acf.website} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-surface font-mono text-[11px] text-accent hover:border-accent transition-colors">
                                        <Globe size={12} /> Site oficial
                                    </a>
                                )}
                                {acf.instagram && (
                                    <a href={acf.instagram} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-surface font-mono text-[11px] text-accent hover:border-accent transition-colors">
                                        <AtSign size={12} /> Instagram
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Produtos mais conhecidos — tira visual, imagem é o que gera reconhecimento */}
            {products.length > 0 && (
                <div className="border-b border-border/40 bg-surface/20">
                    <div className="page-wrap py-6">
                        <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted mb-4">Produtos & Serviços mais conhecidos</h2>
                        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                            {products.map(p => (
                                <div key={p.name} className="flex flex-col items-center gap-2 shrink-0 w-[120px]">
                                    <div className="relative w-[120px] h-[120px] rounded-xl overflow-hidden bg-surface border border-border flex items-center justify-center">
                                        {p.image ? (
                                            <Image src={p.image} alt={p.name} fill className="object-cover" sizes="120px" />
                                        ) : (
                                            <span className="text-[32px] opacity-40">{indEmoji}</span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-center leading-tight text-foreground/80 line-clamp-2">{p.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="page-wrap py-8 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
                {/* Conteúdo */}
                <div>
                    {company.content.rendered && (
                        <div className="wp-article-content"
                            dangerouslySetInnerHTML={{ __html: company.content.rendered }} />
                    )}
                </div>

                {/* Sidebar */}
                <aside className="space-y-5">
                    {/* Marcas do grupo */}
                    {acf.global_brands && acf.global_brands.length > 0 && (
                        <div className="rounded-xl border border-border bg-surface/40 p-5">
                            <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted mb-3">Marcas do Grupo</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {acf.global_brands.map(b => (
                                    <span key={b} className="px-2.5 py-1 rounded-full border border-border font-mono text-[11px] text-foreground/80 bg-background">{b}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dados da empresa */}
                    {(acf.founder || acf.ceo || acf.chaebol_group) && (
                        <div className="rounded-xl border border-border bg-surface/40 p-5">
                            <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted mb-3">Ficha</h3>
                            <dl className="space-y-2">
                                {acf.founder && (
                                    <div className="flex justify-between gap-2">
                                        <dt className="font-mono text-[11px] text-muted">Fundador</dt>
                                        <dd className="text-[12px] text-foreground/80 text-right">{acf.founder}</dd>
                                    </div>
                                )}
                                {acf.ceo && (
                                    <div className="flex justify-between gap-2">
                                        <dt className="font-mono text-[11px] text-muted">CEO</dt>
                                        <dd className="text-[12px] text-foreground/80 text-right">{acf.ceo}</dd>
                                    </div>
                                )}
                                {acf.chaebol_group && (
                                    <div className="flex justify-between gap-2">
                                        <dt className="font-mono text-[11px] text-muted">Grupo</dt>
                                        <dd className="text-[12px] text-foreground/80 text-right">{acf.chaebol_group}</dd>
                                    </div>
                                )}
                                {acf.status && acf.status !== 'active' && (
                                    <div className="flex justify-between gap-2">
                                        <dt className="font-mono text-[11px] text-muted">Status</dt>
                                        <dd className="text-[12px] text-foreground/80 text-right capitalize">{acf.status}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    )}

                    {/* Curiosidades */}
                    {acf.curiosidades && acf.curiosidades.length > 0 && (
                        <div className="rounded-xl border border-surface-editorial bg-surface-editorial/30 p-5">
                            <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-accent mb-3">Curiosidades</h3>
                            <ul className="space-y-2">
                                {acf.curiosidades.map((c, i) => (
                                    <li key={i} className="text-[13px] text-foreground/80 leading-relaxed">💡 {c}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </aside>
            </div>

            {/* Relacionadas */}
            {relatedCompanies.length > 0 && (
                <div className="border-t border-border/40">
                    <div className="page-wrap py-8">
                        <h2 className="text-[18px] font-black tracking-tight mb-5">Mais empresas sul-coreanas</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {relatedCompanies.map(c => {
                                const cname = stripHtml(c.title.rendered)
                                const cImg = c.featured_image_url
                                const cEmoji = emojiDoSetor(c.acf?.industry)
                                return (
                                    <Link key={c.id} href={`/empresas/${c.slug}`}
                                        className="group flex items-center gap-3 p-3 rounded-xl border border-border hover:border-accent transition-colors">
                                        <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-surface border border-border flex items-center justify-center">
                                            {cImg ? (
                                                <Image src={cImg} alt={cname} fill className="object-contain p-1" sizes="40px" />
                                            ) : (
                                                <span className="text-[18px]">{cEmoji}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold group-hover:text-accent transition-colors line-clamp-1">{cname}</p>
                                            {rotuloDoSetor(c.acf?.industry) && (
                                                <p className="font-mono text-[10px] text-muted">{rotuloDoSetor(c.acf?.industry)}</p>
                                            )}
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                        <div className="mt-6">
                            <Link href="/empresas" className="font-mono text-[12px] font-semibold text-muted hover:text-foreground transition-colors">
                                ← Ver todas as empresas
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
