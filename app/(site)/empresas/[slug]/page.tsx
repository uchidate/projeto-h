import { SITE_NAME } from '@/lib/constants/site'
import { intlLocale, formatDate } from '@/lib/i18n/format'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getCompanyBySlug, getCompanies, getRelatedCompanies, countCompaniesInChaebolGroup, rotuloDoSetor, emojiDoSetor } from '@/lib/wordpress/companies'
import { SITE_URL } from '@/lib/constants/site'
import { stripHtml, getWPImage, slugify, normalizeWPImageHost } from '@/lib/utils'
import { buildWordPressMetadata } from '@/lib/seo/wordpress'
import { buildBreadcrumbSchema, buildOrganizationSchema } from '@/lib/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLd'
import { WpEditSetter } from '@/components/ui/WpEditContext'
import { Globe, AtSign } from 'lucide-react'
import { LojaEmLinha } from '@/components/ui/LojaEmLinha'
import { CitadoNoBlog } from '@/components/ui/CitadoNoBlog'
import { getVitrineVinculada } from '@/lib/wordpress/vitrine'
import { getPostsQueCitam } from '@/lib/wordpress/posts'
import { getMencoesNoAcervo } from '@/lib/wordpress/mentions'
import { MencionadoAcervo } from '@/components/companies/MencionadoAcervo'
import { metaDescription } from '@/lib/seo/metaDescription'
import { ProfileSection } from '@/components/profiles/ProfileSection'
import { GroupAnimatedStats } from '@/components/groups/GroupAnimatedStats'
import { ConexoesChaebol } from '@/components/companies/ConexoesChaebol'
import { CompanyFounderQuote } from '@/components/companies/CompanyFounderQuote'
import { CompanyMilestonesTimeline } from '@/components/companies/CompanyMilestonesTimeline'
import { ProdutoConhecidoTile } from '@/components/companies/ProdutoConhecidoTile'
import { CompanyGallery } from '@/components/companies/CompanyGallery'

function semAcento(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/**
 * Palavras-núcleo do nome do produto (sem parênteses, sem palavras curtas) — o
 * título do anúncio na loja quase nunca é igual ao nome editorial ("Buldak (Hot
 * Chicken Ramen)" vs "Caixa Lamen Coreano Super Apimentado Buldak 140g 40
 * Pacotes"), então a correspondência exige que TODAS as palavras-núcleo
 * apareçam no título, não substring completa.
 */
function nucleoProduto(nome: string): string[] {
    return semAcento(nome.replace(/\(.*?\)/g, '')).split(/\s+/).filter(w => w.length >= 3)
}

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
    const resumo = stripHtml(company.excerpt?.rendered || company.content?.rendered || '')
    const description = resumo
        ? metaDescription(resumo)
        : `${name}: empresa sul-coreana de ${industry.toLowerCase()}${company.acf?.founded_year ? `, fundada em ${company.acf.founded_year}` : ''}. História, produtos e curiosidades.`
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

    const [vitrine, posts, mentions] = await Promise.all([
        getVitrineVinculada(acf.linked_products, [name, ...(acf.global_brands ?? []), ...(acf.famous_products ?? [])], `empresa:${slug}`),
        getPostsQueCitam(name),
        getMencoesNoAcervo(name, 3, { excluirCpt: 'company', excluirSlug: slug }),
    ])

    const hasOwnChaebolGroup = !!acf.chaebol_group && acf.chaebol_group.trim().toLowerCase() !== name.trim().toLowerCase()
    const [relatedCompanies, siblingCount] = await Promise.all([
        getRelatedCompanies(company.id, acf.industry, 6, hasOwnChaebolGroup ? acf.chaebol_group : null),
        hasOwnChaebolGroup ? countCompaniesInChaebolGroup(acf.chaebol_group!) : Promise.resolve(0),
    ])
    // Hub só vale a pena com pelo menos mais uma empresa do mesmo grupo no acervo.
    const groupHubHref = hasOwnChaebolGroup && siblingCount > 1 ? `/empresas/grupo/${slugify(acf.chaebol_group!)}` : null
    // Mesma blindagem contra autorreferência do ConexoesChaebol: sem isso, a
    // seção renderiza vazia (só título) pra fichas como a da Abib.
    const hasOtherGlobalBrands = (acf.global_brands ?? []).some(b => b.trim().toLowerCase() !== name.trim().toLowerCase())

    const stats = [
        acf.founded_year && { label: 'Fundação', value: String(acf.founded_year) },
        acf.employees && { label: 'Funcionários', value: acf.employees.toLocaleString(intlLocale()) },
        acf.revenue && { label: 'Receita', value: acf.revenue },
    ].filter((s): s is { label: string; value: string } => Boolean(s))

    // "Nome do produto|URL da imagem" — URL é opcional, mesmo padrão pipe-delimited de awards/milestones
    const products = (acf.famous_products ?? []).map(p => {
        const [prodName, prodImage] = p.split('|').map(s => s.trim())
        return { name: prodName, image: prodImage ? normalizeWPImageHost(prodImage) : null }
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
                                <div className="text-[15px] leading-relaxed text-foreground/80 mt-4 max-w-xl"
                                    dangerouslySetInnerHTML={{ __html: company.excerpt.rendered }} />
                            )}

                            {/* Stats rápidos */}
                            <div className="flex flex-wrap gap-3 mt-5">
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

            {stats.length > 0 && <GroupAnimatedStats stats={stats} accent="var(--color-accent)" />}

            {/* Produtos mais conhecidos — abre as ofertas da loja sem sair da página */}
            {products.length > 0 && (
                <div className="border-b border-border/40 bg-surface/20">
                    <div className="page-wrap py-6">
                        <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted mb-4">Produtos & Serviços mais conhecidos</h2>
                        <div className="flex gap-3 overflow-x-auto overflow-y-visible pb-1 scrollbar-none">
                            {products.map(p => {
                                const nucleo = nucleoProduto(p.name)
                                const ofertas = vitrine
                                    .filter(v => {
                                        const titulo = semAcento(stripHtml(v.title.rendered))
                                        return nucleo.length > 0 && nucleo.every(w => titulo.includes(w))
                                    })
                                    .filter(v => v.acf.affiliate_url)
                                    .map(v => ({
                                        id: v.id,
                                        nome: stripHtml(v.title.rendered),
                                        image: v.acf.image_url,
                                        price: v.acf.price,
                                        store: v.acf.store ?? 'outro',
                                        href: v.acf.affiliate_url!,
                                    }))
                                return (
                                    <ProdutoConhecidoTile key={p.name} name={p.name} image={p.image} emoji={indEmoji}
                                        ofertas={ofertas} contexto={`empresa:${slug}`} />
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {acf.founder_quote_text && (
                <ProfileSection id="citacao" indented={false}>
                    <CompanyFounderQuote
                        quote={acf.founder_quote_text}
                        author={acf.founder_quote_author || acf.founder || name}
                        context={acf.founder_quote_context}
                        accent="var(--color-accent)"
                    />
                </ProfileSection>
            )}

            {acf.milestones && acf.milestones.length > 0 && (
                <ProfileSection id="historia" indented={false}>
                    <CompanyMilestonesTimeline milestones={acf.milestones} accent="var(--color-accent)" />
                </ProfileSection>
            )}

            {acf.gallery_urls && acf.gallery_urls.length > 0 && (
                <ProfileSection id="galeria" indented={false}>
                    <CompanyGallery name={name} urls={acf.gallery_urls} />
                </ProfileSection>
            )}

            {(hasOwnChaebolGroup || hasOtherGlobalBrands) && (
                <ProfileSection id="conexoes" indented={false}>
                    <ConexoesChaebol
                        companyName={name}
                        chaebolGroup={acf.chaebol_group}
                        groupHubHref={groupHubHref}
                        globalBrands={acf.global_brands}
                    />
                </ProfileSection>
            )}

            <ProfileSection id="conteudo" indented={false}>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
                    {/* Conteúdo */}
                    <div>
                        {company.content.rendered && (
                            <div className="wp-article-content"
                                dangerouslySetInnerHTML={{ __html: company.content.rendered }} />
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-5">

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

                        {company.modified && (
                            <p className="font-mono text-[10px] text-muted/70">Atualizado em {formatDate(company.modified)}</p>
                        )}
                    </aside>
                </div>
            </ProfileSection>

            {/* Loja e blog */}
            {(vitrine.length > 0 || posts.length > 0 || mentions.length > 0) && (
                <ProfileSection id="loja-blog" indented={false}>
                    <div className="space-y-6">
                        <LojaEmLinha products={vitrine} bloco="empresa-ficha" contexto="empresa:{slug}" title="Produtos da marca" />
                        <CitadoNoBlog posts={posts} />
                        <MencionadoAcervo mentions={mentions} />
                    </div>
                </ProfileSection>
            )}

            {/* Relacionadas */}
            {relatedCompanies.length > 0 && (
                <ProfileSection id="relacionadas" indented={false}>
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
                </ProfileSection>
            )}
        </>
    )
}
