import { describe, it, expect } from 'vitest'
import { exigeNavegacaoCompleta } from './navegar'

const ORIGEM = 'https://www.hallyuhub.com.br'

describe('exigeNavegacaoCompleta', () => {
    it('listagem com filtro, paginação ou busca exige', () => {
        expect(exigeNavegacaoCompleta('/productions?genre=drama', ORIGEM)).toBe(true)
        expect(exigeNavegacaoCompleta('/blog?category=k-beauty', ORIGEM)).toBe(true)
        expect(exigeNavegacaoCompleta('/artists?page=2', ORIGEM)).toBe(true)
        expect(exigeNavegacaoCompleta(`${ORIGEM}/loja?categoria=lightstick`, ORIGEM)).toBe(true)
    })

    it('vale em todos os idiomas (a lista só tinha o português)', () => {
        expect(exigeNavegacaoCompleta('/ja/artists?page=2', ORIGEM)).toBe(true)
        expect(exigeNavegacaoCompleta('/en/groups?page=2', ORIGEM)).toBe(true)
        expect(exigeNavegacaoCompleta('/en/productions?genre=drama', ORIGEM)).toBe(true)
        expect(exigeNavegacaoCompleta('/en/foods?page=2', ORIGEM)).toBe(true)
        expect(exigeNavegacaoCompleta('/ja/guides?kind=receitas', ORIGEM)).toBe(true)
        expect(exigeNavegacaoCompleta('/ja/artists', ORIGEM)).toBe(false)
        expect(exigeNavegacaoCompleta('/ja/artists/iu?x=1', ORIGEM)).toBe(false)
    })

    it('página de guia com paginação ou filtro exige, em todos os idiomas', () => {
        expect(exigeNavegacaoCompleta('/guias/atores-coreanos?page=2', ORIGEM)).toBe(true)
        expect(exigeNavegacaoCompleta('/en/guides/atores-coreanos?page=2', ORIGEM)).toBe(true)
        expect(exigeNavegacaoCompleta('/ja/guides/atores-coreanos?genre=drama', ORIGEM)).toBe(true)
        expect(exigeNavegacaoCompleta('/es/guides/atores-coreanos?page=2', ORIGEM)).toBe(true)
        expect(exigeNavegacaoCompleta('/guias/atores-coreanos', ORIGEM)).toBe(false)
    })

    it('toda rota migrada com desvio para /filtrado exige navegação completa, em todos os idiomas', async () => {
        const { ROTAS_MIGRADAS } = await import('@/lib/i18n/rotas-migradas.mjs')
        const { LOCALES } = await import('@/lib/i18n/idiomas.mjs')
        const { localizarCaminho } = await import('@/lib/i18n/localizar-caminho')
        const faltando: string[] = []
        for (const rota of ROTAS_MIGRADAS) {
            if (!rota.filtrado) continue
            for (const locale of LOCALES) {
                const chaves = locale === 'pt' ? rota.filtrado.pt : ((rota.filtrado as Record<string, string[] | undefined>)[locale] ?? rota.filtrado.en ?? [])
                if (!chaves?.length) continue
                const base = rota.pt.replace(/:[a-z]+/g, 'exemplo')
                const url = `${localizarCaminho(base, locale)}?${chaves[0]}=x`
                if (!exigeNavegacaoCompleta(url, ORIGEM)) faltando.push(url)
            }
        }
        expect(faltando).toEqual([])
    })

    it('listagem sem query, páginas de detalhe e outras rotas não exigem', () => {
        expect(exigeNavegacaoCompleta('/productions', ORIGEM)).toBe(false)
        expect(exigeNavegacaoCompleta('/productions/escandalo-e-intriga?x=1', ORIGEM)).toBe(false)
        expect(exigeNavegacaoCompleta('/quiz?x=1', ORIGEM)).toBe(false)
    })

    it('link externo nunca exige', () => {
        expect(exigeNavegacaoCompleta('https://outro.com/productions?genre=drama', ORIGEM)).toBe(false)
    })
})
