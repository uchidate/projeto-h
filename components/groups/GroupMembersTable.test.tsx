import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import profile from '@/messages/pt/profile.json'
import type { LinhaIntegrante } from '@/lib/seo/integrantes'
import { GroupMembersTable } from './GroupMembersTable'

const linha = (slug: string, extra: Partial<LinhaIntegrante> = {}): LinhaIntegrante => ({
    slug, nome: slug.toUpperCase(), hangul: null, nascimento: null, idade: null, posicoes: [], ...extra,
})

function html(linhas: LinhaIntegrante[]) {
    return renderToStaticMarkup(
        <NextIntlClientProvider locale="pt" messages={{ profile }}>
            <GroupMembersTable groupName="SEVENTEEN" linhas={linhas} />
        </NextIntlClientProvider>,
    )
}

describe('GroupMembersTable', () => {
    it('é uma tabela semântica com legenda, cabeçalhos de coluna e de linha', () => {
        const saida = html([linha('a')])
        expect(saida).toContain('<table')
        expect(saida).toContain('<caption')
        expect(saida).toContain('Idade e posição dos integrantes do SEVENTEEN')
        expect(saida.match(/<th scope="col"/g)).toHaveLength(4)
        expect(saida).toContain('<th scope="row"')
    })

    it('uma linha por integrante, cada nome com link para o perfil', () => {
        const saida = html([linha('a'), linha('b'), linha('c')])
        expect(saida.match(/<tbody>[\s\S]*<\/tbody>/)?.[0].match(/<tr/g)).toHaveLength(3)
        for (const s of ['a', 'b', 'c']) expect(saida).toContain(`/artists/${s}"`)
    })

    it('mostra nascimento em <time>, idade, posições e hangul', () => {
        const saida = html([linha('a', {
            nascimento: '1995-08-08', idade: 31, posicoes: ['Líder', 'Main Vocal'], hangul: '에스쿱스',
        })])
        expect(saida).toContain('<time dateTime="1995-08-08">')
        expect(saida).toContain('>31<')
        expect(saida).toContain('Líder, Main Vocal')
        expect(saida).toContain('에스쿱스')
    })

    it('dado ausente vira traço, sem inventar valor', () => {
        const saida = html([linha('a')])
        expect(saida).not.toContain('<time')
        expect((saida.match(/—/g) ?? []).length).toBe(3)
    })

    it('sem integrantes, não renderiza nada', () => {
        expect(html([])).toBe('')
    })
})
