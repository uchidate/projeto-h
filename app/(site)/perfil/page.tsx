import { getServerSession } from 'next-auth'
import { getWpToken } from '@/lib/auth/wpToken'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserStats, getUserContentStates } from '@/lib/wordpress/userApi'
import { getAllFandoms } from '@/lib/wordpress/fandoms'
import { stripHtml } from '@/lib/utils'
import { PerfilClient, type TorcidaDoPerfil } from '@/components/features/PerfilClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Meu Perfil',
    robots: { index: false, follow: true },
}

/** Torcidas cujo grupo principal (ou qualquer grupo dela) o usuário segue na conta. */
async function getTorcidasDoUsuario(token: string | null | undefined): Promise<TorcidaDoPerfil[]> {
    const [{ states }, fandoms] = await Promise.all([
        getUserContentStates(token).catch(() => ({ states: [] })),
        getAllFandoms().catch(() => []),
    ])
    const gruposSeguidos = new Set(states.filter(s => s.objectType === 'group' && s.state === 'following').map(s => s.objectId))
    if (gruposSeguidos.size === 0) return []
    return fandoms
        .filter(f => f.groups.some(g => gruposSeguidos.has(g.id)))
        .map(f => ({ slug: f.slug, nome: f.name, cor: f.color ?? '#c39bff', grupo: stripHtml(f.groups[0]?.title.rendered ?? '') }))
}

export default async function PerfilPage() {
    const session = await getServerSession(authOptions)
    if (!session) redirect('/entrar?callbackUrl=/perfil')

    const token = await getWpToken()
    const [stats, torcidas] = await Promise.all([
        getUserStats(token).catch(() => ({
            favoritesCount: 0,
            watchlistCount: 0,
            joinDate: '',
        })),
        getTorcidasDoUsuario(token),
    ])

    return (
        <PerfilClient
            user={{
                name: session.user.name ?? '',
                email: session.user.email ?? '',
                image: session.user.image ?? null,
                bio: session.user.bio ?? '',
            }}
            stats={stats}
            torcidas={torcidas}
        />
    )
}
