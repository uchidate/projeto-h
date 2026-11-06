import { notFound } from 'next/navigation'
import { entrarNaPagina } from '@/lib/i18n/pagina'

type Params = Promise<{ locale: string; resto: string[] }>

/**
 * Captura toda URL sem rota dentro de um idioma (`/en/qualquer-coisa`) só para dar 404 já no idioma.
 * Sem esta página, o Next caía em `app/global-not-found.tsx`, que monta o casco sempre em português.
 * Idioma inválido ou desligado continua em 404, pelo próprio `entrarNaPagina`.
 */
export default async function PaginaInexistente({ params }: { params: Params }) {
    const { locale } = await params
    entrarNaPagina(locale)
    notFound()
}
