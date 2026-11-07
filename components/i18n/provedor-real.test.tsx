import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactElement } from 'react'
import ptClient from '@/messages/pt/client.json'
import enClient from '@/messages/en/client.json'
import { GroupErasTimeline } from '@/components/groups/GroupErasTimeline'
import { GroupColorIdentity } from '@/components/groups/GroupColorIdentity'
import { SearchResultsPage } from '@/components/features/SearchResultsPage'
import { MinhasListasClient } from '@/components/features/MinhasListasClient'
import { DashboardClient } from '@/components/features/DashboardClient'
import { PerfilClient } from '@/components/features/PerfilClient'

// O setup global (vitest.setup.ts) troca o next-intl por um tradutor que lê TODAS as mensagens
// em português, ignorando o provedor — por isso nenhum teste pegava namespace ausente nem idioma.
// Aqui vale o next-intl de verdade.
vi.mock('next-intl', async () => await vi.importActual('next-intl'))

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: () => {}, refresh: () => {} }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}))

/**
 * Renderiza componentes de cliente com o MESMO provedor da produção (SiteShell entrega só
 * `{ client }`), nos dois idiomas. Chave ausente lança em vez de só registrar: é o
 * MISSING_MESSAGE que derrubou o build e que os testes sem provedor não viam.
 */
function renderizar(locale: 'pt' | 'en', elemento: ReactElement) {
    const messages = { client: locale === 'pt' ? ptClient : enClient }
    return renderToStaticMarkup(
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="America/Sao_Paulo" onError={erro => { throw erro }}>
            {elemento}
        </NextIntlClientProvider>,
    )
}

const casos: Array<[string, () => ReactElement]> = [
    ['GroupErasTimeline', () => <GroupErasTimeline historico={['HISTÓRICO|2016|Estreia', 'HISTÓRICO|2020|Retorno']} accent="#ff3399" groupName="BLACKPINK" />],
    ['GroupColorIdentity', () => <GroupColorIdentity officialColor="#ff3399" groupName="BLACKPINK" fanClubName="BLINK" lightstick="Hammer" />],
    ['SearchResultsPage', () => <SearchResultsPage query="" results={[]} />],
    ['MinhasListasClient', () => (
        <MinhasListasClient initialTab="favoritos" favProductions={[]} watchProductions={[]} watchingProductions={[]} watchedProductions={[]}
            favoriteIds={[]} watchlistIds={[]} watchingIds={[]} watchedIds={[]} />
    )],
    ['DashboardClient', () => (
        <DashboardClient user={{ name: 'Ana Souza', email: 'a@b.c', image: null }}
            stats={{ favoritesCount: 2, watchlistCount: 1, joinDate: '', daysSinceJoin: 3 }}
            favProductions={[]} watchProductions={[]} watchingProductions={[]} savedPosts={[]} readPosts={[]} followedArtists={[]} followedGroups={[]} latestPosts={[]} />
    )],
    ['PerfilClient', () => <PerfilClient user={{ name: 'Ana', email: 'a@b.c', image: null, bio: '' }} stats={{ favoritesCount: 0, watchlistCount: 0, joinDate: '2026-01-10' }} />],
]

describe('componentes de cliente com o provedor real (pt e en)', () => {
    it.each(casos)('%s renderiza sem MISSING_MESSAGE em pt e en', (_nome, criar) => {
        expect(() => renderizar('pt', criar())).not.toThrow()
        expect(() => renderizar('en', criar())).not.toThrow()
    })

    it('em inglês não sobra o texto em português que a tradução substituiu', () => {
        const dashboard = renderizar('en', casos[4][1]())
        expect(dashboard).toContain('My Wave')
        expect(dashboard).not.toContain('Próximos passos')
        const perfil = renderizar('en', casos[5][1]())
        expect(perfil).not.toContain('Complete seu perfil')
    })
})
