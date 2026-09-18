import type { Metadata } from 'next'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import Image from 'next/image'
import Link from 'next/link'
import { getCompanies, COMPANY_INDUSTRY_LABELS, COMPANY_INDUSTRY_EMOJI } from '@/lib/wordpress/companies'
import type { CompanyIndustry } from '@/lib/wordpress/types'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { stripHtml } from '@/lib/utils'

export const revalidate = 600

type SearchParams = Promise<{ search?: string; page?: string; industry?: string; chaebol?: string }>

export async function generateMetadata(): Promise<Metadata> {
    const url = `${SITE_URL}/empresas`
    return {
        title: 'Empresas Sul-Coreanas — Samsung, Hyundai, Kakao e muito mais',
        description: 'Conheça as maiores e mais influentes empresas da Coreia do Sul — tecnologia, entretenimento, automotivo, games, beauty e muito mais.',
        alternates: { canonical: url },
        openGraph: baseOG(url),
        twitter: baseTwitter(),
    }
}

const VALID_INDUSTRIES = Object.keys(COMPANY_INDUSTRY_LABELS) as CompanyIndustry[]

export default async function EmpresasPage({ searchParams }: { searchParams: SearchParams }) {
    const sp = await searchParams
    const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
    const industry = VALID_INDUSTRIES.includes(sp.industry as CompanyIndustry) ? (sp.industry as CompanyIndustry) : undefined
    const chaebol = sp.chaebol === 'true' ? true : undefined

    const { items: companies, total, totalPages } = await getCompanies({
        page, perPage: 48, search: sp.search, industry, chaebol,
        orderby: 'date', order: 'desc',
    })

    return (
        <div>
            {/* Header */}
            <div className="border-b border-border/40">
                <div className="page-wrap py-6 sm:py-10">
                    <p className="font-mono text-[11px] text-muted uppercase tracking-[0.06em] mb-1">Economia & Negócios</p>
                    <h1 className="text-[28px] sm:text-[40px] font-black tracking-[-0.03em] leading-tight">
                        Empresas Sul-Coreanas
                    </h1>
                    <p className="text-[14px] leading-relaxed text-foreground/70 mt-3 max-w-2xl">
                        Das montadoras globais aos grupos de K-Pop, dos semicondutores ao K-Beauty — o mapa das empresas que fazem da Coreia do Sul uma potência econômica e cultural.
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className="border-b border-border/40 bg-surface/30">
                <div className="page-wrap py-3 flex flex-wrap gap-2">
                    <Link href="/empresas"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[11px] font-semibold transition-colors border ${!industry && !chaebol ? 'bg-accent-a11y text-white border-accent-a11y' : 'border-border text-muted hover:text-foreground hover:border-border-strong'}`}>
                        Todas
                    </Link>
                    <Link href="/empresas?chaebol=true"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[11px] font-semibold transition-colors border ${chaebol ? 'bg-accent-a11y text-white border-accent-a11y' : 'border-border text-muted hover:text-foreground hover:border-border-strong'}`}>
                        🏛️ Chaebols
                    </Link>
                    {VALID_INDUSTRIES.map(ind => (
                        <Link key={ind} href={`/empresas?industry=${ind}`}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[11px] font-semibold transition-colors border ${industry === ind ? 'bg-accent-a11y text-white border-accent-a11y' : 'border-border text-muted hover:text-foreground hover:border-border-strong'}`}>
                            <span>{COMPANY_INDUSTRY_EMOJI[ind]}</span>
                            {COMPANY_INDUSTRY_LABELS[ind]}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="page-wrap py-8">
                {companies.length === 0 ? (
                    <div className="flex flex-col items-center py-20 text-center">
                        <p className="text-[48px] mb-4">🏢</p>
                        <p className="text-[16px] font-bold mb-1">Nenhuma empresa encontrada</p>
                        <p className="text-[13px] text-muted mb-4">Em breve mais empresas no catálogo.</p>
                        <Link href="/empresas" className="text-[13px] font-semibold text-accent hover:underline">← Ver todas as empresas</Link>
                    </div>
                ) : (
                    <>
                        <p className="font-mono text-[11px] text-muted mb-6">
                            {total} empresa{total !== 1 ? 's' : ''}
                            {industry ? ` em ${COMPANY_INDUSTRY_LABELS[industry]}` : ''}
                            {chaebol ? ' (Chaebols)' : ''}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {companies.map(company => {
                                const name = stripHtml(company.title.rendered)
                                const acf = company.acf ?? {}
                                const img = company.featured_image_url
                                const indLabel = acf.industry ? COMPANY_INDUSTRY_LABELS[acf.industry] : null
                                const indEmoji = acf.industry ? COMPANY_INDUSTRY_EMOJI[acf.industry] : '🏢'

                                return (
                                    <Link key={company.id} href={`/empresas/${company.slug}`}
                                        className="group flex items-start gap-4 p-4 rounded-xl border border-border hover:border-accent transition-colors bg-background hover:bg-surface/60">
                                        {/* Logo / inicial */}
                                        <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-surface border border-border group-hover:border-accent transition-colors flex items-center justify-center">
                                            {img ? (
                                                <Image src={img} alt={name} fill className="object-contain p-1" sizes="56px" />
                                            ) : (
                                                <span className="text-[24px]">{indEmoji}</span>
                                            )}
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[14px] font-bold leading-tight group-hover:text-accent transition-colors line-clamp-1">{name}</p>
                                            {acf.name_korean && (
                                                <p className="text-[11px] text-muted mt-0.5">{acf.name_korean}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                {indLabel && (
                                                    <span className="font-mono text-[10px] text-muted/70">{indLabel}</span>
                                                )}
                                                {acf.founded_year && (
                                                    <>
                                                        <span className="text-muted/30">·</span>
                                                        <span className="font-mono text-[10px] text-muted/60">Est. {acf.founded_year}</span>
                                                    </>
                                                )}
                                                {acf.is_chaebol && (
                                                    <>
                                                        <span className="text-muted/30">·</span>
                                                        <span className="font-mono text-[10px] text-accent/70">Chaebol</span>
                                                    </>
                                                )}
                                            </div>
                                            {acf.famous_products && acf.famous_products.length > 0 && (
                                                <p className="text-[11px] text-muted/60 mt-1 line-clamp-1">
                                                    {acf.famous_products.slice(0, 3).join(' · ')}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>

                        {/* ~8.300px de rolagem no celular e nenhum anúncio até 2026-09-18. */}
                        {companies.length > 0 && ADSENSE.slots.inline && (
                            <div className="mt-10">
                                <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="empresas_lista" />
                            </div>
                        )}

                        {totalPages > 1 && (
                            <div className="flex items-center gap-3 mt-10 pt-6 border-t border-border">
                                {page > 1 && (
                                    <Link href={`/empresas?page=${page - 1}${industry ? `&industry=${industry}` : ''}`}
                                        className="font-mono text-[12px] font-semibold text-muted hover:text-foreground transition-colors">← Anterior</Link>
                                )}
                                <span className="font-mono text-[11px] text-muted ml-auto">Página {page} de {totalPages}</span>
                                {page < totalPages && (
                                    <Link href={`/empresas?page=${page + 1}${industry ? `&industry=${industry}` : ''}`}
                                        className="font-mono text-[12px] font-semibold text-accent hover:underline">Próxima →</Link>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
