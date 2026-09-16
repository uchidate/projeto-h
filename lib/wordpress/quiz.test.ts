import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getQuizQuestions } from './quiz'

function wpQuestion(overrides: Record<string, unknown> = {}) {
    return {
        id: 1,
        question: 'Quem lançou "Dynamite"?',
        option_a: 'BTS', option_b: 'BLACKPINK', option_c: 'EXO', option_d: 'TWICE',
        correct_option: 'a',
        explanation: 'BTS lançou Dynamite em 2020.',
        category: 'k-pop',
        difficulty: 'easy',
        ...overrides,
    }
}

describe('getQuizQuestions', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    function mockSinglePage(items: unknown[]) {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => items,
            headers: new Map([['X-WP-Total', String(items.length)], ['X-WP-TotalPages', '1']]),
        })
    }

    it('normaliza correct_option (letra) pro índice numérico certo', async () => {
        mockSinglePage([wpQuestion({ correct_option: 'c' })])
        const [q] = await getQuizQuestions()
        expect(q.correct).toBe(2)
    })

    it('usa índice 0 (opção "a") quando correct_option está ausente ou é inválido', async () => {
        mockSinglePage([wpQuestion({ correct_option: undefined })])
        const [q] = await getQuizQuestions()
        expect(q.correct).toBe(0)
    })

    it('normaliza "história" (com acento) pra "historia" (canônico)', async () => {
        mockSinglePage([wpQuestion({ category: 'história' })])
        const [q] = await getQuizQuestions()
        expect(q.category).toBe('historia')
    })

    it('normaliza categoria com espaços/maiúsculas (case-insensitive, trim)', async () => {
        mockSinglePage([wpQuestion({ category: '  K-Drama  ' })])
        const [q] = await getQuizQuestions()
        expect(q.category).toBe('k-drama')
    })

    it('cai pra "k-pop" quando a categoria não é reconhecida', async () => {
        mockSinglePage([wpQuestion({ category: 'categoria-invalida' })])
        const [q] = await getQuizQuestions()
        expect(q.category).toBe('k-pop')
    })

    it('usa "medium" como difficulty default quando ausente', async () => {
        mockSinglePage([wpQuestion({ difficulty: undefined })])
        const [q] = await getQuizQuestions()
        expect(q.difficulty).toBe('medium')
    })

    it('descarta perguntas sem o texto da pergunta (dado incompleto no WP)', async () => {
        mockSinglePage([wpQuestion({ question: '' }), wpQuestion({ id: 2 })])
        const result = await getQuizQuestions()
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe(2)
    })

    it('descarta perguntas com alguma opção vazia (dado incompleto no WP)', async () => {
        mockSinglePage([wpQuestion({ option_b: '' }), wpQuestion({ id: 2 })])
        const result = await getQuizQuestions()
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe(2)
    })

    it('relatedHref/relatedLabel ficam null quando ausentes (não string vazia)', async () => {
        mockSinglePage([wpQuestion({ related_post_url: undefined, related_post_label: undefined })])
        const [q] = await getQuizQuestions()
        expect(q.relatedHref).toBeNull()
        expect(q.relatedLabel).toBeNull()
    })

    it('filtra por categoria quando opts.category é passado', async () => {
        mockSinglePage([wpQuestion({ id: 1, category: 'k-pop' }), wpQuestion({ id: 2, category: 'k-drama' })])
        const result = await getQuizQuestions({ category: 'k-drama' })
        expect(result.map(q => q.id)).toEqual([2])
    })

    it('filtra por difficulty quando opts.difficulty é passado', async () => {
        mockSinglePage([wpQuestion({ id: 1, difficulty: 'easy' }), wpQuestion({ id: 2, difficulty: 'hard' })])
        const result = await getQuizQuestions({ difficulty: 'hard' })
        expect(result.map(q => q.id)).toEqual([2])
    })

    it('busca páginas adicionais em paralelo quando totalPages > 1 e junta tudo', async () => {
        // atenção: "per_page=100" contém "page=1" como substring — checar
        // "&page=N" (com o & antes) evita esse falso-positivo
        fetchMock.mockImplementation(async (url: string) => {
            if (url.includes('&page=1')) {
                return {
                    ok: true,
                    json: async () => [wpQuestion({ id: 1 })],
                    headers: new Map([['X-WP-Total', '3'], ['X-WP-TotalPages', '3']]),
                }
            }
            if (url.includes('&page=2')) return { ok: true, json: async () => [wpQuestion({ id: 2 })] }
            if (url.includes('&page=3')) return { ok: true, json: async () => [wpQuestion({ id: 3 })] }
            return { ok: true, json: async () => [] }
        })
        const result = await getQuizQuestions()
        expect(result.map(q => q.id).sort()).toEqual([1, 2, 3])
    })
})
