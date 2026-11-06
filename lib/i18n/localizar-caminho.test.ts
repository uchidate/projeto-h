// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { localizarCaminho } from './localizar-caminho'

describe('localizarCaminho', () => {
    it('português passa intacto', () => {
        expect(localizarCaminho('/artists/iu', 'pt')).toBe('/artists/iu')
    })
    it('prefixa rotas de mesmo caminho', () => {
        expect(localizarCaminho('/artists/iu', 'en')).toBe('/en/artists/iu')
        expect(localizarCaminho('/groups', 'en')).toBe('/en/groups')
        expect(localizarCaminho('/', 'en')).toBe('/en')
    })
    it('traduz o caminho quando difere entre idiomas, mantendo query e âncora', () => {
        expect(localizarCaminho('/comidas/kimchi', 'en')).toBe('/en/foods/kimchi')
        expect(localizarCaminho('/empresas/grupo/cj?x=1#a', 'en')).toBe('/en/companies/group/cj?x=1#a')
        expect(localizarCaminho('/calendario', 'en')).toBe('/en/calendar')
        expect(localizarCaminho('/guias/skincare', 'en')).toBe('/en/guides/skincare')
    })
    it('rota estática vence rota com parâmetro', () => {
        expect(localizarCaminho('/artists/birthdays', 'en')).toBe('/en/artists/birthdays')
    })
    it('externo, âncora, já prefixado e fora do registro passam intactos', () => {
        for (const c of ['https://x.com/a', '//cdn.x/a', '#topo', '/en/artists/iu', '/api/home', '/loja/x']) {
            expect(localizarCaminho(c, 'en')).toBe(c)
        }
    })
})
