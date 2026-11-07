import { SITE_NAME } from '@/lib/constants/site'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { metadataDaRota } from '@/lib/i18n/metadata-pagina'
import Link from '@/components/i18n/LocalizedLink'
import { POSITIONS } from '@/lib/constants/positions'
import { traduzirChave } from '@/lib/i18n/chave-dinamica'
import { rotuloDaPosicao } from '@/lib/constants/rotulo-posicao'
import { PageBreadcrumb } from '@/components/seo/PageBreadcrumb'


export async function metadataDaPagina(locale: Locale = DEFAULT_LOCALE): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'client.positionsPage' })
    return metadataDaRota({ locale, rota: 'positions', titulo: t('title'), descricao: t('description', { site: SITE_NAME }) })
}

export default async function PositionsIndexPage({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
    const t = await getTranslations({ locale, namespace: 'client.positionsPage' })
    return (
        <>
            <PageBreadcrumb items={[{ name: t('crumb'), path: '/positions' }]} />
        <div className="mx-auto max-w-4xl px-4 py-10">
            <h1 className="text-2xl font-black text-foreground sm:text-3xl">{t('title')}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
                {t('intro')}{' '}
                <Link href="/blog/posicoes-grupo-kpop-lider-vocal-visual-maknae-guia" className="underline decoration-dotted underline-offset-2 hover:text-accent">
                    {t('guideLink')}
                </Link>.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {POSITIONS.map(value => (
                    <Link
                        key={value}
                        href={`/positions/${value}`}
                        className="group border border-border bg-surface p-4 transition-colors hover:border-accent"
                    >
                        <p className="font-bold text-foreground group-hover:text-accent">{rotuloDaPosicao(t, value)}</p>
                        <p className="mt-0.5 text-xs text-muted">{traduzirChave(t, `descriptions.${value}`)}</p>
                    </Link>
                ))}
            </div>
        </div>
        </>
    )
}
