// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KOREA_REGIONS } from '@/lib/wordpress/foods'
import { KoreaRegionMap } from './KoreaRegionMap'

const getFoods = vi.hoisted(() => vi.fn())
vi.mock('@/lib/wordpress/foods', async importOriginal => ({
    ...(await importOriginal<typeof import('@/lib/wordpress/foods')>()),
    getFoods,
}))
vi.mock('next-intl/server', () => ({
    getTranslations: async () => (chave: string, v?: Record<string, unknown>) => (v?.region ? `${chave}:${v.region}:${v.count}` : chave),
}))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ scroll: _scroll, ...props }: ComponentProps<'a'> & { scroll?: boolean }) => <a {...props} />,
}))

const comPratos = (totais: Record<string, number>) =>
    getFoods.mockImplementation(async ({ region }: { region: string }) => ({ items: [], total: totais[region] ?? 0 }))

const montar = async (props: Parameters<typeof KoreaRegionMap>[0] = {}) => render(await KoreaRegionMap(props)).container
const hrefs = (c: Element, seletor: string) => [...c.querySelectorAll(seletor)].map(a => a.getAttribute('href'))

describe('KoreaRegionMap', () => {
    beforeEach(() => {
        getFoods.mockReset()
        comPratos({ Seoul: 4, Sejong: 1 })
    })
    afterEach(cleanup)

    it('conta uma vez cada região, sem pedir idioma no padrão', async () => {
        await montar()
        expect(getFoods.mock.calls.map(c => c[0].region)).toEqual([...KOREA_REGIONS])
        expect(getFoods.mock.calls[0][0]).toEqual({ region: KOREA_REGIONS[0], perPage: 1, locale: undefined })
    })

    it('só vira link a região que tem prato, no mapa e nas fichas', async () => {
        const c = await montar()
        const esperado = ['/comidas?region=Seoul', '/comidas?region=Sejong']
        expect(hrefs(c, 'svg a').sort()).toEqual([...esperado].sort())
        expect(hrefs(c, 'svg + div a').sort()).toEqual([...esperado].sort())
        expect(c.querySelectorAll('polygon')).toHaveLength(KOREA_REGIONS.length - 1)
        expect(c.querySelector('circle')).toBeTruthy()
    })

    it('Sejong sem prato fica como ponto sem link', async () => {
        comPratos({ Seoul: 4 })
        const c = await montar()
        expect(c.querySelector('circle')?.closest('a')).toBeNull()
    })

    it('começa fechado e sem opção de limpar', async () => {
        const c = await montar()
        expect(c.querySelector('details')?.open).toBe(false)
        expect(c.textContent).not.toContain('regionClear')
    })

    it('filtrando, abre o mapa e oferece voltar à lista', async () => {
        const c = await montar({ activeRegion: 'Seoul' })
        expect(c.querySelector('details')?.open).toBe(true)
        expect(hrefs(c, 'svg + div a')).toContain('/comidas')
    })

    it('em outro idioma, conta e linka na versão dele', async () => {
        const c = await montar({ locale: 'en' })
        expect(getFoods.mock.calls[0][0].locale).toBe('en')
        expect(hrefs(c, 'svg a').every(h => h?.startsWith('/en/'))).toBe(true)
    })
})
