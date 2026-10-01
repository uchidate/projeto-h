import { JsonLd } from '@/components/seo/JsonLd'
import { buildBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_NAME, SITE_URL } from '@/lib/constants/site'

type Crumb = { name: string; path: string }

// BreadcrumbList das páginas de listagem: o Google troca a URL do resultado
// pela trilha (Início › Seção) na busca. `path` é relativo ao site.
export function PageBreadcrumb({ items }: { items: Crumb[] }) {
    return (
        <JsonLd
            data={buildBreadcrumbSchema([
                { name: SITE_NAME, url: SITE_URL },
                ...items.map(i => ({ name: i.name, url: `${SITE_URL}${i.path}` })),
            ])}
        />
    )
}
