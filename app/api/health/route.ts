import { NextResponse } from 'next/server'
import { WP_API_URL } from '@/lib/wordpress/config'

export const dynamic = 'force-dynamic'

// Checa se o WordPress responde de verdade, não só se o Next.js está de pé.
// Motivo: em 2026-07-04 o WP ficou 500 (Redis fora do ar) enquanto esse
// endpoint continuava respondendo {ok:true} sempre — o deploy nunca teria
// detectado o problema. Timeout curto pra não travar a verificação de saúde
// que o deploy faz (scripts/deploy-manual.sh) caso o WP esteja só lento.
type WordPressHealth = {
    ok: boolean
    latencyMs: number
    reason?: 'http-error' | 'invalid-response' | 'unreachable'
}

async function checkWordPress(): Promise<WordPressHealth> {
    const startedAt = Date.now()
    try {
        const res = await fetch(WP_API_URL, {
            cache: 'no-store',
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(3000),
        })
        const latencyMs = Date.now() - startedAt
        if (!res.ok) return { ok: false, latencyMs, reason: 'http-error' }

        let payload: { namespaces?: unknown }
        try {
            payload = await res.json() as { namespaces?: unknown }
        } catch {
            return { ok: false, latencyMs, reason: 'invalid-response' }
        }
        if (!Array.isArray(payload?.namespaces)) {
            return { ok: false, latencyMs, reason: 'invalid-response' }
        }
        return { ok: true, latencyMs }
    } catch {
        return { ok: false, latencyMs: Date.now() - startedAt, reason: 'unreachable' }
    }
}

/**
 * Commit em execução, curto.
 *
 * Em 2026-09-12 houve confusão sobre qual versão estava no staging: ele é um
 * ambiente só, cada push de branch o sobrescreve, e nada dizia o que estava no
 * ar. O deploy já injeta GIT_COMMIT_SHA nos dois ambientes; expor 7 caracteres
 * responde a pergunta com um curl, e `git log`/`gh` mapeiam para a branch.
 */
function commitEmExecucao(): string {
    return (process.env.GIT_COMMIT_SHA ?? '').slice(0, 7) || 'desconhecido'
}

export async function GET() {
    const wordpress = await checkWordPress()
    return NextResponse.json(
        {
            ok: wordpress.ok,
            wordpress: wordpress.ok ? 'up' : 'down',
            latencyMs: wordpress.latencyMs,
            commit: commitEmExecucao(),
            ...(wordpress.reason ? { reason: wordpress.reason } : {}),
        },
        {
            status: wordpress.ok ? 200 : 503,
            headers: { 'Cache-Control': 'no-store, max-age=0' },
        },
    )
}
