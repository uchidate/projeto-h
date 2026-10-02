import type { Metadata } from 'next'
import { GuiasIndice, buildGuiasMetadata } from '@/app/(site)/guias/GuiasIndice'

export function generateMetadata(): Metadata {
    return buildGuiasMetadata()
}

// Estática de propósito: ler `searchParams` aqui tornaria a rota dinâmica
// (`cache-control: no-store`, Cloudflare em BYPASS). O filtro `?kind=` é
// desviado para ./filtrado por um rewrite em next.config.mjs.
export const revalidate = 3600

export default function GuiasPage() {
    return <GuiasIndice />
}
