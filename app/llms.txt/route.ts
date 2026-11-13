import { buildLlmsTxt } from '@/lib/seo/llmsTxt'

// Texto estático gerado a partir do registro de rotas; renova uma vez por dia.
export const revalidate = 86400

export function GET() {
    return new Response(buildLlmsTxt(), {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
    })
}
