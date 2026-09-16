// Administrador ficticio para os testes da barra de edicao (identidade.mjs).
process.env.NEXT_PUBLIC_ADMIN_EMAILS ??= 'admin@example.com'
import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// RTL não limpa o DOM entre testes automaticamente no Vitest (só faz isso
// nativamente com Jest) — sem isso, cada `render()` de um novo teste some com
// os elementos do teste anterior ainda no DOM, causando "multiple elements
// found" em queries que deveriam achar só um. Guard por `document` pra não
// quebrar os testes .test.ts em ambiente 'node' (sem DOM).
if (typeof document !== 'undefined') {
    afterEach(() => cleanup())
}

// jsdom não implementa ResizeObserver — polyfill mínimo pra componentes que
// observam resize de elementos (ex: BlogSuggestedNext espelhando a largura do placeholder).
if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
}

// next-intl fora do Next: componentes com `useTranslations` renderizam em
// português, que é o idioma padrão e a fonte das mensagens. Testes que precisem
// de outro idioma sobrescrevem este mock no próprio arquivo.
vi.mock('next-intl', async () => {
    const actual = await vi.importActual<typeof import('next-intl')>('next-intl')
    const { createTranslator } = actual
    const { PT_MESSAGES: messages } = await import('@/lib/i18n/messages')
    return {
        ...actual,
        useLocale: () => 'pt',
        useTranslations: (namespace?: string) =>
            createTranslator({ locale: 'pt', messages, namespace: namespace as never }),
        NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
    }
})
