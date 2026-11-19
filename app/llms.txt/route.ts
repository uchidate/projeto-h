import { buildLlmsTxt } from '@/lib/seo/llmsTxt'
import { getMapaDeGuias } from '@/lib/guias/i18n'

// Texto estático gerado a partir do registro de rotas; renova uma vez por dia.
export const revalidate = 86400

export async function GET() {
    const guias = await getMapaDeGuias()
    return new Response(buildLlmsTxt({ temGuias: (locale) => guias.traduzidos(locale).length > 0 }), {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
    })
}
