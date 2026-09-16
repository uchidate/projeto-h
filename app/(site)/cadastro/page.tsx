import { Suspense } from 'react'
import { googleAtivo } from '@/lib/auth/googleAtivo'
import type { Metadata } from 'next'
import { CadastroForm } from '@/components/features/CadastroForm'

// Dinâmica de propósito: decide se mostra o botão do Google lendo variáveis que
// só existem em tempo de execução. Pré-renderizada no build, a página congelava
// com o botão desligado. Ver lib/auth/googleAtivo.ts.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Criar conta',
    robots: { index: false, follow: true },
}

export default function CadastroPage() {
    // Ver o comentário equivalente em /entrar: o segredo fica no servidor.
    return (
        <Suspense>
            <CadastroForm googleAtivo={googleAtivo()} />
        </Suspense>
    )
}
