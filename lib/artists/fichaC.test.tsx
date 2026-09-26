import { describe, it, expect } from 'vitest'
import type { ProfileEntry } from '@/components/profiles/ProfileSection'
import { reordenarPorAba, limitarAnuncios, abasDasAncoras } from './fichaC'

const bloco = (id: string): ProfileEntry => ({ id, nav: id, present: true, render: () => null }) as ProfileEntry
const ad = (key: string): ProfileEntry => ({ key, interstitial: null }) as unknown as ProfileEntry

describe('ficha C', () => {
    it('põe música antes de obras e universo antes de ler, sem mexer nos intervalos', () => {
        const e = [bloco('biografia'), ad('meio-ficha'), bloco('filmografia'), bloco('artigos'), bloco('grupos'), bloco('musica')]
        const r = reordenarPorAba(e).map(x => ('id' in x ? x.id : x.key))
        expect(r).toEqual(['biografia', 'meio-ficha', 'musica', 'filmografia', 'grupos', 'artigos'])
    })
    it('limita anúncios aos 3 primeiros e preserva o resto', () => {
        const e = [ad('meio-ficha'), ad('story-feed-ad'), ad('inline-ad'), ad('discovery-ad'), bloco('biografia')]
        expect(limitarAnuncios(e, 3)).toHaveLength(4)
    })
    it('gera até 6 abas e pula grupos ausentes', () => {
        const abas = abasDasAncoras(['biografia', 'trajetoria', 'filmografia', 'faq'], a => a)
        expect(abas.map(a => a.href)).toEqual(['#biografia', '#trajetoria', '#filmografia', '#faq'])
    })
})
