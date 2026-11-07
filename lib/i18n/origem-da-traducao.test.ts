import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compararOrigem, hashDoTexto, type DiferencaDeOrigem } from './origem-da-traducao'
import { ALL_HUBS } from '@/lib/guias'
import { todasReceitas } from '@/lib/receitas'

const RAIZ = process.cwd()
const ATUALIZAR = process.env.I18N_ORIGEM_WRITE === '1'

describe('hashDoTexto / compararOrigem', () => {
    it('é estável à ordem dos campos e muda com o texto', () => {
        expect(hashDoTexto({ a: 1, b: ['x'] })).toBe(hashDoTexto({ b: ['x'], a: 1 }))
        expect(hashDoTexto({ a: 'um' })).not.toBe(hashDoTexto({ a: 'dois' }))
    })

    it('separa desatualizada, sem registro e órfã', () => {
        expect(compararOrigem({ a: '1', b: '2', c: '3' }, { a: '1', b: 'x', z: '9' })).toEqual({ desatualizadas: ['b'], semRegistro: ['c'], orfas: ['z'] })
    })
})

/** Texto de origem que cada tradução cobre. Mudou aqui = revisar a tradução. */
const origemDosGuias = () => Object.fromEntries(ALL_HUBS.map(h => [h.slug, hashDoTexto({
    title: h.title, shortTitle: h.shortTitle, description: h.description, intro: h.intro, whatYouWillFind: h.whatYouWillFind ?? null, faq: h.faq,
})]))
const slugsTraduzidos = (arquivo: string) => Object.keys(JSON.parse(readFileSync(join(RAIZ, arquivo), 'utf8')) as Record<string, unknown>)
/** Idioma com tradução parcial: a origem cobre só os guias que já têm texto. */
const origemDosGuiasEm = (arquivo: string) => () => {
    const todos = origemDosGuias()
    return Object.fromEntries(slugsTraduzidos(arquivo).map(slug => [slug, todos[slug]]).filter(([, hash]) => hash))
}
const origemDasReceitas = () => Object.fromEntries(Object.entries(todasReceitas('pt')).map(([slug, r]) => [slug, hashDoTexto({
    rendimento: r.rendimento ?? null, ingredientes: r.ingredientes, passos: r.passos, dicas: r.dicas ?? [],
})]))

const FONTES: Array<{ nome: string; arquivo: string; atual: () => Record<string, string>; comoRever: string }> = [
    { nome: 'guias em inglês', arquivo: 'lib/guias/traducoes/en.origem.json', atual: origemDosGuias, comoRever: 'revise o guia em lib/guias/traducoes/en.json' },
    { nome: 'guias em espanhol', arquivo: 'lib/guias/traducoes/es.origem.json', atual: origemDosGuiasEm('lib/guias/traducoes/es.json'), comoRever: 'revise o guia em lib/guias/traducoes/es.json' },
    { nome: 'receitas em inglês', arquivo: 'data/receitas.en.origem.json', atual: origemDasReceitas, comoRever: 'revise a receita em data/receitas.en.json' },
]

describe.each(FONTES)('traduções desatualizadas: $nome', ({ arquivo, atual, comoRever }) => {
    const caminho = join(RAIZ, arquivo)

    it('o texto em português não mudou desde que foi traduzido', () => {
        const hoje = atual()
        if (ATUALIZAR) {
            writeFileSync(caminho, `${JSON.stringify(hoje, null, 2)}\n`)
            return
        }
        expect(existsSync(caminho), `falta ${arquivo}; rode npm run i18n:origem`).toBe(true)
        const registrado = JSON.parse(readFileSync(caminho, 'utf8')) as Record<string, string>
        const dif: DiferencaDeOrigem = compararOrigem(hoje, registrado)
        const msg = [
            dif.desatualizadas.length && `português mudou: ${dif.desatualizadas.join(', ')} — ${comoRever} e rode npm run i18n:origem`,
            dif.semRegistro.length && `sem registro de origem: ${dif.semRegistro.join(', ')} — rode npm run i18n:origem`,
            dif.orfas.length && `registro de item removido: ${dif.orfas.join(', ')} — rode npm run i18n:origem`,
        ].filter(Boolean).join('\n')
        expect(msg).toBe('')
    })
})
