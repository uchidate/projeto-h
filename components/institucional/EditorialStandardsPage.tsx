import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/lib/i18n/config'
import { PaginaDeTexto, Titulo2, linksDe } from './Texto'

export async function EditorialStandardsPage({ locale }: { locale: Locale }) {
    const t = await getTranslations({ locale, namespace: 'institucional.standards' })
    const links = linksDe(locale)
    return (
        <PaginaDeTexto titulo={t('title')}>
            <p>{t('intro')}</p>
            <Titulo2>{t('newsTitle')}</Titulo2>
            <p>{t('news')}</p>
            <Titulo2>{t('guidesTitle')}</Titulo2>
            <p>{t('guides')}</p>
            <Titulo2>{t('sourcesTitle')}</Titulo2>
            <p>{t('sources')}</p>
            <Titulo2>{t('aiTitle')}</Titulo2>
            <p>{t('ai')}</p>
            <Titulo2>{t('correctionsTitle')}</Titulo2>
            <p>{t.rich('corrections', links)}</p>
        </PaginaDeTexto>
    )
}
