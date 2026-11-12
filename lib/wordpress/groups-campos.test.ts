import { describe, expect, it } from 'vitest'
import { camposDoGrupo } from './groups'

describe('camposDoGrupo', () => {
    it('completo mantém acf e translations inteiros', () => {
        expect(camposDoGrupo('en')).toContain(',acf,former_member_slugs,translations')
        expect(camposDoGrupo(undefined)).not.toContain('translations')
    })

    it('leve pede só a estreia e, com idioma, título e stale daquele idioma', () => {
        const campos = camposDoGrupo('ja', true).split(',')
        expect(campos).toContain('acf.debut_date')
        expect(campos).toContain('translations.ja.title')
        expect(campos).toContain('translations.ja.stale')
        expect(campos).not.toContain('acf')
        expect(campos).not.toContain('translations')
    })

    it('leve sem idioma não pede tradução', () => {
        expect(camposDoGrupo(undefined, true)).toBe('id,slug,title,date,featured_image_url,acf.debut_date')
    })
})
