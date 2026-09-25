import { ADSENSE_CLIENT } from '@/lib/constants/identidade.mjs'
import type { Metadata } from 'next'
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL, OG_IMAGE } from '@/lib/constants/site'

// A verificação do Search Console não depende mais de meta no HTML: as três
// propriedades (domínio, com www e sem www) estão verificadas por DNS (TXT) e as
// de prefixo também por arquivo HTML. Se outra conta precisar de acesso por tag,
// informe o token na env — ela soma, nunca substitui.
const GOOGLE_SITE_VERIFICATION = [process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION].filter(
    (token): token is string => Boolean(token),
)

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    openGraph: {
        siteName: SITE_NAME,
        type: 'website',
        images: [OG_IMAGE],
    },
    twitter: {
        card: 'summary_large_image',
        images: [OG_IMAGE.url],
    },
    icons: {
        icon: '/icon-192.png',
        apple: '/icon-192.png',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true },
    },
    verification: {
        google: GOOGLE_SITE_VERIFICATION,
    },
    // Verificação de propriedade do AdSense (terceiro caminho aceito, ao lado do
    // snippet e do ads.txt). O publisher vem da configuração e precisa bater
    // com o ads.txt e com o `client` do endpoint de monetização do WP.
    ...(ADSENSE_CLIENT ? { other: { 'google-adsense-account': ADSENSE_CLIENT } } : {}),
    alternates: {
        types: {
            'application/rss+xml': `${SITE_URL}/feed.xml`,
            'application/rss+xml; category=noticias-kpop': `${SITE_URL}/feed/noticias-kpop.xml`,
        },
    },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return children
}
