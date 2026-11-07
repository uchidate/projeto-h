import { describe, expect, it } from 'vitest'
import { extrairTextos, linhasEmPortugues, pareceEmPortugues, regressoes } from './vazamento'

describe('pareceEmPortugues', () => {
    it.each([
        'Teste o que você sabe',
        'Ler citação na fonte',
        'Qual é o nome real de Suga, do BTS?',
        'toque para copiar',
        'Salvo na Minha Onda',
        'Em qual festival americano o grupo se tornou headliner?',
    ])('acusa português: %s', linha => {
        expect(pareceEmPortugues(linha)).toBe(true)
    })

    it.each([
        'Try a different search term.',
        'Who is the Leader in each group',
        'Jungkook, the group\'s maknae, joined as a trainee at 15',
        'BLACKPINK',
        'Rosé (BLACKPINK)',
        'Hallyu in Korea: a guide to the Korean wave',
        'Gochujang, soy sauce and sesame oil',
    ])('não acusa inglês nem nome próprio: %s', linha => {
        expect(pareceEmPortugues(linha)).toBe(false)
    })
})

describe('extrairTextos / linhasEmPortugues', () => {
    const html = `
      <html><head><style>.a{content:"você não"}</style><script>var x="para você"</script></head>
      <body><svg><text>para você</text></svg>
      <h1>Trending in K-Pop</h1><p>Ler citação na fonte</p><p>Ler citação na fonte</p>
      <p>Tom &amp; Jerry com uma casa</p></body></html>`

    it('ignora script, style e svg e decodifica entidades', () => {
        const textos = extrairTextos(html)
        expect(textos).toContain('Tom & Jerry com uma casa')
        expect(textos.join('|')).not.toContain('var x')
    })

    it('devolve as linhas suspeitas sem repetição', () => {
        expect(linhasEmPortugues(html)).toEqual(['Ler citação na fonte', 'Tom & Jerry com uma casa'])
    })
})

describe('regressoes', () => {
    it('só acusa quem passou da linha de base', () => {
        const agora = [
            { caminho: '/en/foods', linhas: [] },
            { caminho: '/en/groups/bts', linhas: ['a', 'b', 'c'] },
            { caminho: '/en/artists/iu', linhas: ['x'] },
            { caminho: '/en/nova', linhas: ['y'] },
        ]
        const base = { '/en/groups/bts': 3, '/en/artists/iu': 0 }
        expect(regressoes(agora, base).map(r => [r.caminho, r.antes, r.agora])).toEqual([
            ['/en/artists/iu', 0, 1],
            ['/en/nova', 0, 1],
        ])
    })
})
