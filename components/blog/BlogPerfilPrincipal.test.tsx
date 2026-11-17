import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { BlogPerfilPrincipal } from './BlogPerfilPrincipal'

describe('BlogPerfilPrincipal', () => {
    it('leva à ficha, nomeia o bloco para medição e usa o convite do tipo', () => {
        const html = renderToStaticMarkup(<BlogPerfilPrincipal entidade={{ name: 'IVE', href: '/groups/ive', image: null, tipo: 'grupo' }} />)
        expect(html).toContain('data-bloco="artigo-perfil-principal"')
        expect(html).toContain('href="/groups/ive"')
        expect(html).toContain('Perfil do grupo')
        expect(html).toContain('Integrantes, discografia')
        expect(html).toContain('Ver perfil')
    })
    it('produção convida para elenco e onde assistir', () => {
        const html = renderToStaticMarkup(<BlogPerfilPrincipal entidade={{ name: 'Tantara', href: '/productions/tantara', image: null, tipo: 'producao' }} />)
        expect(html).toContain('Sobre a produção')
        expect(html).toContain('onde assistir')
    })
})
