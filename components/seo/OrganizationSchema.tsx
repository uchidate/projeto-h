import { JsonLd } from '@/components/seo/JsonLd'
import { buildOrganizationSchema } from '@/lib/seo/jsonld'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/constants/site'

// Montado aqui, não buscado no WordPress: a rota organization-schema nunca
// existiu no CMS (404), e a home ficou sem Organization sem nenhum aviso.
// Só declara o que é verificável — sameAs entra quando houver perfis oficiais.
export function OrganizationSchema() {
    return (
        <JsonLd
            data={{
                ...buildOrganizationSchema({
                    name: SITE_NAME,
                    url: SITE_URL,
                    logo: `${SITE_URL}/icon-192.png`,
                    description: SITE_DESCRIPTION,
                    sameAs: ['https://www.instagram.com/hallyuhub_br/'],
                }),
                '@type': 'NewsMediaOrganization',
                '@id': `${SITE_URL}/#organization`,
                inLanguage: 'pt-BR',
                publishingPrinciples: `${SITE_URL}/editorial-standards`,
                correctionsPolicy: `${SITE_URL}/corrections`,
                ethicsPolicy: `${SITE_URL}/ethics`,
            }}
        />
    )
}
