import { Suspense } from 'react'
import { googleAtivo } from '@/lib/auth/googleAtivo'
import { LoginForm } from '@/components/features/LoginForm'
import type { Metadata } from 'next'

// Dinâmica de propósito: decide se mostra o botão do Google lendo variáveis que
// só existem em tempo de execução. Pré-renderizada no build, a página congelava
// com o botão desligado. Ver lib/auth/googleAtivo.ts.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Entrar',
    robots: { index: false, follow: true },
}

export default function LoginPage() {
    // Lido no servidor e passado como prop: o segredo do Google não pode virar
    // NEXT_PUBLIC_, e o componente cliente não enxerga process.env.
    return (
        <Suspense>
            <LoginForm googleAtivo={googleAtivo()} />
        </Suspense>
    )
}
