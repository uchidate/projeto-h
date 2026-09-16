import { describe, it, expect } from 'vitest'
import { titleAlreadyIncludesSiteName } from './titles'

describe('titleAlreadyIncludesSiteName', () => {
    it('detects the site name at the end, separated by a dash', () => {
        expect(titleAlreadyIncludesSiteName('IU — Perfil completo — Portal')).toBe(true)
    })

    it('detects the site name at the start', () => {
        expect(titleAlreadyIncludesSiteName('Portal | Doramas & Filmes')).toBe(true)
    })

    it('is case-insensitive', () => {
        expect(titleAlreadyIncludesSiteName('IU — portal')).toBe(true)
    })

    it('returns false when the site name is absent', () => {
        expect(titleAlreadyIncludesSiteName('IU — Perfil completo')).toBe(false)
    })

    // Regressão-alvo: a razão de existir desta função é decidir se o template
    // global de título deve rodar de novo — um falso positivo aqui duplica a
    // marca ("Portal — Portal"), um falso negativo deixa a página
    // sem marca nenhuma. Ambos os erros são silenciosos (só aparecem no <title>
    // renderizado, não dão erro de build).
    it('requires a boundary before "Portal" (not glued to another word)', () => {
        expect(titleAlreadyIncludesSiteName('XPortal')).toBe(false)
    })

    it('requires a boundary after "Portal" (not glued to another word)', () => {
        expect(titleAlreadyIncludesSiteName('PortalX')).toBe(false)
    })
})
