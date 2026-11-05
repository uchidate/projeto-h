import type { Metadata } from 'next'
import { SITE_URL, SITE_NAME } from '@/lib/constants/site'
import { DEFAULT_LOCALE, LOCALE_META, type Locale } from './config'

/**
 * Metadados do layout de cada idioma, num lugar só.
 *
 * Antes o português e os demais idiomas tinham layouts separados, cada um com o seu metadata.
 * Na árvore única (`app/[locale]`) o layout é um só e pergunta aqui. O português mantém
 * exatamente o que já estava no ar (título padrão, descrição, `appleWebApp`, robots detalhado); os
 * demais idiomas ficam como estavam, sem descrição própria (cada página define a sua).
 */
export function metadataDoLayout(locale: Locale): Metadata {
    if (locale === DEFAULT_LOCALE) {
        const titulo = `${SITE_NAME} — K-Pop, K-Drama e Cultura Coreana`
        return {
            metadataBase: new URL(SITE_URL),
            title: { template: `%s | ${SITE_NAME}`, default: titulo },
            description: 'Dramas, filmes, artistas e cultura coreana em português. O seu portal Hallyu no Brasil.',
            manifest: '/manifest.webmanifest',
            appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: SITE_NAME },
            openGraph: {
                title: titulo,
                description: 'Dramas, filmes, artistas e cultura coreana em português.',
                siteName: SITE_NAME,
                locale: LOCALE_META[locale].ogLocale,
                type: 'website',
                url: SITE_URL,
            },
            robots: {
                index: true,
                follow: true,
                googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
            },
        }
    }
    return {
        metadataBase: new URL(SITE_URL),
        title: { template: `%s | ${SITE_NAME}`, default: SITE_NAME },
        manifest: '/manifest.webmanifest',
        openGraph: { siteName: SITE_NAME, locale: LOCALE_META[locale].ogLocale, type: 'website' },
    }
}
