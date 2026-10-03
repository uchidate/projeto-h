import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/lib/i18n/config'
import { Lista, PaginaDeTexto, Titulo2, linksDe } from './Texto'

export async function AboutPage({ locale }: { locale: Locale }) {
    const t = await getTranslations({ locale, namespace: 'institucional.about' })
    const links = linksDe(locale)
    return (
        <PaginaDeTexto titulo={t('title')}>
            <p>{t.rich('p1', links)}</p>
            <p>{t('p2')}</p>
            <Titulo2>{t('findTitle')}</Titulo2>
            <Lista itens={[t('find1'), t('find2'), t('find3'), t('find4')]} />
            <Titulo2>{t('transparencyTitle')}</Titulo2>
            <p>{t.rich('transparency', links)}</p>
            <Titulo2>{t('contactTitle')}</Titulo2>
            <p>{t.rich('contact', links)}</p>
        </PaginaDeTexto>
    )
}
