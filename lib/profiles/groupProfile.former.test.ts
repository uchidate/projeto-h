import { describe, expect, it } from 'vitest'
import { countActiveMembers, parseFormerMembers } from './groupProfile'

describe('parseFormerMembers', () => {
    it('deriva o nome do slug quando não há nome explícito', () => {
        expect(parseFormerMembers(['nako-yabuki'])).toEqual([
            { slug: 'nako-yabuki', name: 'Nako Yabuki' },
        ])
    })

    it('usa o nome depois da barra, sem reformatar', () => {
        expect(parseFormerMembers(['min-joo|Kim Min-ju'])).toEqual([
            { slug: 'min-joo', name: 'Kim Min-ju' },
        ])
    })

    it('ignora espaços em volta do slug e do nome', () => {
        expect(parseFormerMembers([' hitomi-honda | Hitomi Honda '])).toEqual([
            { slug: 'hitomi-honda', name: 'Hitomi Honda' },
        ])
    })

    it('devolve lista vazia quando o campo não existe', () => {
        expect(parseFormerMembers(undefined)).toEqual([])
    })
})

describe('parseFormerMembers com sufixo de grupo', () => {
    it('remove o slug do grupo usado como desambiguador', () => {
        expect(parseFormerMembers(['chanmi-aoa'], 'aoa')[0].name).toBe('Chanmi')
        expect(parseFormerMembers(['lee-jin-lovelyz'], 'lovelyz')[0].name).toBe('Lee Jin')
    })

    it('remove sufixo de grupo com mais de uma palavra', () => {
        expect(parseFormerMembers(['navi-secret-number'], 'secret-number')[0].name).toBe('Navi')
        expect(parseFormerMembers(['kim-do-yeon-wekimeki'], 'weki-meki')[0].name).toBe('Kim Do Yeon')
    })

    it('remove número de desambiguação no fim', () => {
        expect(parseFormerMembers(['kim-na-young-gugudan-2'], 'gugudan')[0].name).toBe('Kim Na Young')
    })

    it('não come o nome inteiro quando ele é igual ao sufixo', () => {
        expect(parseFormerMembers(['taeil'], 'taeil')[0].name).toBe('Taeil')
    })
})

describe('countActiveMembers', () => {
    it('não desconta ex-integrante que nunca esteve na lista de posts', () => {
        // ZB1: 8 posts carregados, 4 ex — mas um deles (Ricky) não tem ficha no CPT.
        const posts = ['zhang-hao', 'seok-matthew', 'sung-hanbin', 'kim-gyuvin', 'kim-jiwoong', 'han-yujin', 'kim-taerae', 'park-gunwook']
        const ex = ['zhang-hao', 'kim-gyuvin', 'han-yujin', 'ricky-zb1']
        expect(countActiveMembers(posts, ex, 4)).toBe(5)
    })

    it('cai no valor do modelo quando não há posts carregados', () => {
        expect(countActiveMembers([], ['saiu'], 7)).toBe(7)
    })
})
