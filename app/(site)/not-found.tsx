import type { Metadata } from 'next'
import { PaginaNaoEncontrada } from '@/components/features/PaginaNaoEncontrada'

export const metadata: Metadata = {
    title: 'Página não encontrada',
    robots: { index: false, follow: true },
}

export default function NaoEncontrado() {
    return <PaginaNaoEncontrada />
}
