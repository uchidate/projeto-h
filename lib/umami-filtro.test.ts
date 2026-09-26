// @vitest-environment jsdom
import { beforeEach, describe, it, expect } from 'vitest'
import { rotaSemMedicao, umamiAntesDeEnviar } from './umami-filtro'

describe('rotaSemMedicao', () => {
    it('pega as rotas de autenticação e o que vem abaixo delas', () => {
        for (const r of ['/entrar', '/cadastro', '/cadastro/etapa-2', '/entrar/']) {
            expect(rotaSemMedicao(r)).toBe(true)
        }
    })

    it('não atinge páginas que só começam com o mesmo texto', () => {
        // O risco real é falso positivo: silenciar a medição de página de conteúdo.
        for (const r of ['/', '/blog', '/entrarnoclube', '/cadastros', '/artists/entrar', '/perfil']) {
            expect(rotaSemMedicao(r)).toBe(false)
        }
    })
})

describe('umamiAntesDeEnviar', () => {
    it('descarta o que é das rotas excluídas, com URL completa ou só o caminho', () => {
        expect(umamiAntesDeEnviar('event', { url: 'https://www.hallyuhub.com.br/entrar' })).toBeNull()
        expect(umamiAntesDeEnviar('performance', { url: '/cadastro/etapa-2?ref=x' })).toBeNull()
    })

    beforeEach(() => window.localStorage.clear())

    it('evento e pageview ganham tipo da página e classe da visita, mantendo o resto', () => {
        const p = { url: 'https://www.hallyuhub.com.br/artists/lisa?ref=1', lcp: 1200 }
        expect(umamiAntesDeEnviar('event', p)).toEqual({ ...p, data: { tipo_pagina: 'ficha-artista', visita: 'novo' } })
    })

    it('o que o evento já traz vence o contexto automático', () => {
        const p = { url: '/blog/x', data: { tipo_pagina: 'custom', block: 'menu' } }
        expect(umamiAntesDeEnviar('event', p)?.data).toEqual({ tipo_pagina: 'custom', visita: 'novo', block: 'menu' })
    })

    it('desempenho e identify passam intactos (não são eventos de navegação)', () => {
        const p = { url: '/blog/x', lcp: 900 }
        expect(umamiAntesDeEnviar('performance', p)).toBe(p)
        expect(umamiAntesDeEnviar('identify', p)).toBe(p)
    })

    it('na dúvida, não perde medição', () => {
        const semUrl = { name: 'evento' } as { url?: string; name: string }
        expect(umamiAntesDeEnviar('event', semUrl)).toBe(semUrl)
        const malformada = { url: 'http://[' }
        expect(umamiAntesDeEnviar('event', malformada)).toBe(malformada)
    })
})
