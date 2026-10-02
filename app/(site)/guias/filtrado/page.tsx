import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { GuiasIndice, buildGuiasMetadata } from '@/app/(site)/guias/GuiasIndice'

// Rota interna: next.config.mjs reescreve /guias?kind=… para cá, mantendo a URL
// pública. O canonical continua apontando para /guias, como antes do desvio.
export function generateMetadata(): Metadata {
    return buildGuiasMetadata()
}

export default async function GuiasFiltradoPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
    const { kind } = await searchParams
    if (!kind) redirect('/guias')
    return <GuiasIndice kind={kind} />
}
