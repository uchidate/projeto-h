import { redirecionarSecao } from '@/lib/redes/linkCurto'

export const dynamic = 'force-dynamic'

// Link curto de fichas (`/i/artists/iu`); a regra está em lib/redes/linkCurto.ts. Uma seção sozinha (`/i/loja`)
// cai em `app/i/[id]`, que encaminha para a mesma função.
export async function GET(_request: Request, context: { params: Promise<{ caminho: string[] }> }) {
    const { caminho } = await context.params
    return redirecionarSecao(caminho)
}
