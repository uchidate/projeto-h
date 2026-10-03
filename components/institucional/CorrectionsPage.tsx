import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/lib/i18n/config'
import { Lista, PaginaDeTexto, Titulo2, linksDe } from './Texto'

export async function CorrectionsPage({ locale }: { locale: Locale }) {
    const t = await getTranslations({ locale, namespace: 'institucional.corrections' })
    const links = linksDe(locale)
    return (
        <PaginaDeTexto titulo={t('title')}>
            <p>{t('intro')}</p>
            <Titulo2>{t('requestTitle')}</Titulo2>
            <p>{t.rich('request', links)}</p>
            <Titulo2>{t('howTitle')}</Titulo2>
            <Lista itens={[t('how1'), t('how2'), t('how3'), t('how4')]} />
            <Titulo2>{t('updatesTitle')}</Titulo2>
            <p>{t('updates')}</p>
        </PaginaDeTexto>
    )
}
