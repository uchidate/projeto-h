import { ChevronRight } from 'lucide-react'
import { JsonLd } from '@/components/seo/JsonLd'
import { SITE_URL } from '@/lib/constants/site'
import { BreadcrumbTrail, type BreadcrumbItem } from '@/components/ui/BreadcrumbTrail'

export type Crumb = BreadcrumbItem

interface Props {
    crumbs: Crumb[]
}

export function Breadcrumb({ crumbs }: Props) {
    const all = [{ label: 'Início', href: '/' }, ...crumbs]

    return (
        <>
            {/* Schema BreadcrumbList — melhora rich snippets no Google */}
            <JsonLd
                data={{
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    itemListElement: all.map((c, i) => ({
                        '@type': 'ListItem',
                        position: i + 1,
                        name: c.label,
                        item: c.href ? `${SITE_URL}${c.href}` : undefined,
                    })),
                }}
            />

            <nav aria-label="Caminho de navegação" className="mb-6">
                <BreadcrumbTrail
                    items={all}
                    separator={<ChevronRight size={12} className="opacity-40" />}
                    className="flex flex-wrap items-center gap-1 text-[12px] text-muted"
                    itemClassName="flex items-center gap-1"
                    linkClassName="transition-colors hover:text-foreground"
                    currentClassName="font-medium text-foreground"
                />
            </nav>
        </>
    )
}
