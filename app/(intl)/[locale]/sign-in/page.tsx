import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { googleAtivo } from '@/lib/auth/googleAtivo'
import { LoginForm } from '@/components/auth/LoginForm'
import { entrarNaPagina, idiomaValido } from '@/lib/i18n/pagina'

// Dinâmica de propósito, como /entrar: o botão do Google depende de variáveis
// que só existem em tempo de execução. Ver lib/auth/googleAtivo.ts.
export const dynamic = 'force-dynamic'

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale } = await params
    if (!idiomaValido(locale)) return {}
    const t = await getTranslations({ locale, namespace: 'client.auth.login' })
    return { title: t('title'), robots: { index: false, follow: true } }
}

export default async function SignInPage({ params }: { params: Params }) {
    const { locale } = await params
    entrarNaPagina(locale)
    return (
        <Suspense>
            <LoginForm googleAtivo={googleAtivo()} />
        </Suspense>
    )
}
