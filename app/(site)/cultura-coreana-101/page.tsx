import type { Metadata } from 'next'
import Link from 'next/link'
import { getSiteSettings } from '@/lib/wordpress/site-settings'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { PageBreadcrumb } from '@/components/ui/PageBreadcrumb'
import { BrandDot } from '@/components/ui/BrandDot'
import { JsonLd } from '@/components/seo/JsonLd'

const PAGE_URL = `${SITE_URL}/cultura-coreana-101`
const TITLE = 'Cultura Coreana 101: Guia para Quem Está Começando'
const DESCRIPTION = 'Hangeul, idade coreana, honoríficos, fandoms, tropes de k-drama e mais — os guias essenciais para se ambientar na cultura coreana antes de mergulhar no k-pop e k-drama.'

export const revalidate = 3600

export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: PAGE_URL },
    openGraph: { ...baseOG(PAGE_URL), title: TITLE, description: DESCRIPTION },
    twitter: { ...baseTwitter(), title: TITLE, description: DESCRIPTION },
}

export default async function CulturaCoreana101Page() {
    const siteSettings = await getSiteSettings()
    const guides = siteSettings.cultureGuides

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: TITLE,
        description: DESCRIPTION,
        url: PAGE_URL,
    }

    return (
        <>
            <JsonLd data={jsonLd} />
            <PageBreadcrumb
                crumbs={[{ label: 'Início', href: '/' }, { label: 'Cultura Coreana 101' }]}
                description={`${guides.length} guias`}
            />

            <div className="page-wrap py-8 space-y-8">
                <header className="border-b-2 border-foreground pb-6">
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-accent mb-2">
                        Comece por aqui
                    </p>
                    <h1 className="text-[36px] sm:text-[48px] font-black leading-[0.95] tracking-[-0.04em]">
                        Cultura Coreana 101<BrandDot />
                    </h1>
                    <p className="text-[14px] sm:text-[16px] leading-relaxed text-foreground/70 mt-3 max-w-2xl">
                        Antes de mergulhar fundo no k-pop e no k-drama, esses guias explicam os conceitos que aparecem
                        o tempo todo — do alfabeto coreano aos termos de tratamento, passando pela hierarquia social
                        que estrutura praticamente toda produção coreana.
                    </p>
                </header>

                {guides.length === 0 ? (
                    <p className="text-[14px] text-muted">Em breve, novos guias por aqui.</p>
                ) : (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
                        {guides.map(guide => (
                            <li key={guide.href}>
                                <Link
                                    href={guide.href}
                                    className="group flex items-center gap-3 bg-background p-5 h-full transition-colors hover:bg-surface"
                                >
                                    <span className="text-[26px] leading-none shrink-0" aria-hidden="true">{guide.emoji}</span>
                                    <span className="text-[14px] font-bold leading-snug text-foreground group-hover:text-accent transition-colors">
                                        {guide.label}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    )
}
