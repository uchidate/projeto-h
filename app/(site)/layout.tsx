import type { Metadata } from 'next'
import { SITE_URL, SITE_NAME } from '@/lib/constants/site'
import { SiteShell } from '@/components/layout/SiteShell'

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        template: `%s | ${SITE_NAME}`,
        default: `${SITE_NAME} — K-Pop, K-Drama e Cultura Coreana`,
    },
    description: 'Dramas, filmes, artistas e cultura coreana em português. O seu portal Hallyu no Brasil.',
    manifest: '/manifest.json',
    appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: SITE_NAME },
    openGraph: {
        title: `${SITE_NAME} — K-Pop, K-Drama e Cultura Coreana`,
        description: 'Dramas, filmes, artistas e cultura coreana em português.',
        siteName: SITE_NAME,
        locale: 'pt_BR',
        type: 'website',
        url: SITE_URL,
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
        },
    },
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
    return <SiteShell locale="pt">{children}</SiteShell>
}
