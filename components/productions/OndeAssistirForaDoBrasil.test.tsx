// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { OndeAssistirForaDoBrasil } from './OndeAssistirForaDoBrasil'
import type { Disponibilidade } from '@/lib/tmdb/watchProviders'

const messages = {
    profile: {
        production: { summary: { whereToWatch: 'Onde assistir', notInBrazil: 'Sem streaming oficial no Brasil no momento.', availableAbroad: 'Disponível fora do país' } },
        ui: { sidebar: { justWatch: 'Disponibilidade por JustWatch' } },
    },
}

function renderizar(d: Disponibilidade | null) {
    return render(
        <NextIntlClientProvider locale="pt" messages={messages}>
            <OndeAssistirForaDoBrasil disponibilidade={d} />
        </NextIntlClientProvider>,
    )
}

describe('OndeAssistirForaDoBrasil', () => {
    it('sem Brasil e com regiões: diz que não há streaming e onde existe, com atribuição', () => {
        const { container } = renderizar({ brasil: [], fora: [{ regiao: 'US', provedores: ['Hulu'] }, { regiao: 'KR', provedores: ['wavve', 'Watcha'] }] })
        expect(screen.getByText('Sem streaming oficial no Brasil no momento.')).toBeInTheDocument()
        expect(screen.getByText(/Hulu/)).toBeInTheDocument()
        expect(screen.getByText(/wavve, Watcha/)).toBeInTheDocument()
        expect(screen.getByText('Disponibilidade por JustWatch')).toBeInTheDocument()
        expect(container.querySelector('[data-bloco="ficha-producao-onde-assistir-fora"]')).not.toBeNull()
    })

    it('com provedor no Brasil ou sem informação: não renderiza', () => {
        expect(renderizar({ brasil: ['Netflix'], fora: [] }).container).toBeEmptyDOMElement()
        expect(renderizar(null).container).toBeEmptyDOMElement()
        expect(renderizar({ brasil: [], fora: [] }).container).toBeEmptyDOMElement()
    })
})
