import { describe, expect, it } from 'vitest'
import { zoomDaFoto } from './fotoDeRevendedora'

describe('zoomDaFoto', () => {
    it('dá zoom na foto da loja revendedora e deixa as demais', () => {
        expect(zoomDaFoto(35289)).toBe('scale-[1.3]')
        expect(zoomDaFoto(1)).toBe('')
    })
})
