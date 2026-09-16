import { cookies } from 'next/headers'
import { decode } from 'next-auth/jwt'

/**
 * Token do WordPress lido do JWT do NextAuth, no servidor.
 *
 * O token vivia em `session.user.token`, servido por /api/auth/session e
 * portanto legível por qualquer script no browser — qualquer XSS virava
 * takeover da conta no WP. Ele agora fica só no JWT (cookie httpOnly) e é
 * resolvido aqui; o cliente fala com /api/user/*, que carimba o header.
 *
 * Só pode ser chamado em Server Component, route handler ou server action.
 */
export async function getWpToken(): Promise<string | null> {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) return null

    const store = await cookies()
    const raw = store.get('__Secure-next-auth.session-token')?.value
        ?? store.get('next-auth.session-token')?.value
    if (!raw) return null

    try {
        const jwt = await decode({ token: raw, secret })
        const token = jwt?.token
        return typeof token === 'string' && token.length > 0 ? token : null
    } catch {
        return null
    }
}
