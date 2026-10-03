import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { googleAtivo } from '@/lib/auth/googleAtivo'
import { CadastroForm } from '@/components/auth/CadastroForm'
import { DEFAULT_LOCALE, isActiveLocale } from '@/lib/i18n/config'
import { setPageLocale } from '@/lib/i18n/request-locale'

// Dinâmica de propósito, como /cadastro: o botão do Google depende de variáveis
// que só existem em tempo de execução. Ver lib/auth/googleAtivo.ts.
export const dynamic = 'force-dynamic'

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) return {}
    const t = await getTranslations({ locale, namespace: 'client.auth.signup' })
    return { title: t('title'), robots: { index: false, follow: true } }
}

export default async function SignUpPage({ params }: { params: Params }) {
    const { locale } = await params
    if (!isActiveLocale(locale) || locale === DEFAULT_LOCALE) notFound()
    setPageLocale(locale)
    return (
        <Suspense>
            <CadastroForm googleAtivo={googleAtivo()} />
        </Suspense>
    )
}
