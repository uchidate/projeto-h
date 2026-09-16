// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { alternarPendente, estaPendente, lerPendentes, limparPendentes } from './estadoPendente'

describe('estadoPendente', () => {
    beforeEach(() => {
        window.localStorage.clear()
        vi.restoreAllMocks()
    })

    it('alterna ligando e desligando o mesmo item', () => {
        expect(alternarPendente('production', 1, 'favorite')).toBe(true)
        expect(estaPendente('production', 1, 'favorite')).toBe(true)
        expect(alternarPendente('production', 1, 'favorite')).toBe(false)
        expect(estaPendente('production', 1, 'favorite')).toBe(false)
    })

    it('distingue estados diferentes do mesmo objeto', () => {
        alternarPendente('post', 7, 'saved')
        expect(estaPendente('post', 7, 'saved')).toBe(true)
        expect(estaPendente('post', 7, 'read')).toBe(false)
    })

    it('ignora lixo no storage em vez de quebrar', () => {
        window.localStorage.setItem('hh-estado-pendente-v1', '{"nao":"e array"}')
        expect(lerPendentes()).toEqual([])
        window.localStorage.setItem('hh-estado-pendente-v1', 'isto nao e json')
        expect(lerPendentes()).toEqual([])
        window.localStorage.setItem('hh-estado-pendente-v1', '[{"objectId":"texto","objectType":"post","state":"saved"},{"objectId":2,"objectType":"post","state":"saved"}]')
        expect(lerPendentes()).toEqual([{ objectId: 2, objectType: 'post', state: 'saved' }])
    })

    // O caso que motiva os try/catch: aba anônima com cookies bloqueados faz
    // o próprio acesso a localStorage lançar. O botão não pode cair junto.
    it('sobrevive a localStorage indisponível', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado') })
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado') })
        expect(lerPendentes()).toEqual([])
        expect(() => alternarPendente('artist', 3, 'following')).not.toThrow()
        expect(() => limparPendentes()).not.toThrow()
    })
})
