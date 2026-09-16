import { getServerSession } from 'next-auth'
import { getWpToken } from '@/lib/auth/wpToken'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserStats } from '@/lib/wordpress/userApi'
import { PerfilClient } from '@/components/features/PerfilClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Meu Perfil',
    robots: { index: false, follow: true },
}

export default async function PerfilPage() {
    const session = await getServerSession(authOptions)
    if (!session) redirect('/entrar?callbackUrl=/perfil')

    const stats = await getUserStats(await getWpToken()).catch(() => ({
        favoritesCount: 0,
        watchlistCount: 0,
        joinDate: '',
    }))

    return (
        <PerfilClient
            user={{
                name: session.user.name ?? '',
                email: session.user.email ?? '',
                image: session.user.image ?? null,
                bio: session.user.bio ?? '',
            }}
            stats={stats}
        />
    )
}
