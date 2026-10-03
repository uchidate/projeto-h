import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/lib/i18n/config'
import { Lista, PaginaDeTexto, Titulo2 } from './Texto'

export async function EthicsPage({ locale }: { locale: Locale }) {
    const t = await getTranslations({ locale, namespace: 'institucional.ethics' })
    return (
        <PaginaDeTexto titulo={t('title')}>
            <p>{t('intro')}</p>
            <Titulo2>{t('independenceTitle')}</Titulo2>
            <p>{t('independence')}</p>
            <Titulo2>{t('accuracyTitle')}</Titulo2>
            <Lista itens={[t('accuracy1'), t('accuracy2'), t('accuracy3'), t('accuracy4')]} />
            <Titulo2>{t('conflictsTitle')}</Titulo2>
            <p>{t('conflicts')}</p>
        </PaginaDeTexto>
    )
}
