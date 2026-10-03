import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createTranslator } from 'next-intl'
import ptMessages from '@/messages/pt/institucional.json'
import enMessages from '@/messages/en/institucional.json'
import { linksDe } from './Texto'

const messages = { pt: ptMessages, en: enMessages }

/** `t.rich` com tipo aberto: as chaves aqui são dinâmicas, então o tipo estrito do next-intl não ajuda. */
const rica = (t: unknown) => t as { rich: (chave: string, tags: ReturnType<typeof linksDe>) => React.ReactNode }

/** Mensagens com marcação `<tag>` — a página as lê com `t.rich` e `linksDe`. */
const RICAS: Array<[ns: 'about' | 'standards' | 'corrections', chave: string]> = [
    ['about', 'p1'], ['about', 'transparency'], ['about', 'contact'], ['standards', 'corrections'], ['corrections', 'request'],
]

describe('páginas institucionais', () => {
    it('toda mensagem rica renderiza com links no idioma da página', () => {
        for (const locale of ['pt', 'en'] as const) {
            for (const [ns, chave] of RICAS) {
                const t = createTranslator({ locale, messages: { institucional: messages[locale] }, namespace: `institucional.${ns}` as never })
                const html = renderToStaticMarkup(<>{rica(t).rich(chave, linksDe(locale))}</>)
                expect(html, `${locale} ${ns}.${chave}`).not.toMatch(/<(padroes|etica|correcoes|contato|b)>/)
                if (chave !== 'p1') expect(html).toContain(`href="${locale === 'en' ? '/en' : ''}/`)
            }
        }
    })

    it('links do inglês apontam para as rotas em inglês', () => {
        const t = createTranslator({ locale: 'en', messages: { institucional: enMessages }, namespace: 'institucional.about' as never })
        const html = renderToStaticMarkup(<>{rica(t).rich('transparency', linksDe('en'))}</>)
        expect(html).toContain('href="/en/editorial-standards"')
        expect(html).toContain('href="/en/ethics"')
        expect(html).toContain('href="/en/corrections"')
    })
})
