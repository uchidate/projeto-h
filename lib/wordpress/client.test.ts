import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * client.ts é o único ponto de fetch pra WP REST API (regra do AGENTS.md) —
 * qualquer bug de tratamento de erro aqui afeta todas as páginas do site.
 * Usamos vi.resetModules + import dinâmico em cada teste porque IS_BUILD é
 * calculado uma vez no module-load a partir de process.env.
 */
describe('lib/wordpress/client', () => {
    const originalEnv = { ...process.env }
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        vi.resetModules()
        process.env = { ...originalEnv }
        delete process.env.NEXT_PHASE
        process.env.WORDPRESS_API_URL = 'https://wp.test/wp-json'
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.useRealTimers()
        process.env = originalEnv
        vi.unstubAllGlobals()
    })

    // Endpoint de item único: o [] de wpFetch é truthy e já derrubou a página de
    // artista/grupo ao ser tratado como agência. Aqui falha precisa virar null.
    describe('wpFetchItem', () => {
        it('retorna o objeto quando a resposta é ok', async () => {
            fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 7, slug: 'hybe' }) })
            const { wpFetchItem } = await import('./client')
            expect(await wpFetchItem('/wp/v2/agency/7')).toEqual({ id: 7, slug: 'hybe' })
        })

        it('devolve null quando o WP responde erro', async () => {
            fetchMock.mockResolvedValue({ ok: false, status: 500, statusText: 'err' })
            const { wpFetchItem } = await import('./client')
            expect(await wpFetchItem('/wp/v2/agency/7')).toBeNull()
        })

        it('devolve null quando o WP está inacessível', async () => {
            fetchMock.mockRejectedValue(new Error('timeout'))
            const { wpFetchItem } = await import('./client')
            expect(await wpFetchItem('/wp/v2/agency/7')).toBeNull()
        })

        it('devolve null quando vem array no lugar do objeto', async () => {
            fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
            const { wpFetchItem } = await import('./client')
            expect(await wpFetchItem('/wp/v2/agency/7')).toBeNull()
        })

        it('devolve null durante o build, sem chamar a rede', async () => {
            // IS_BUILD exige as duas condições: fase de build e URL não configurada.
            delete process.env.WORDPRESS_API_URL
            process.env.NEXT_PHASE = 'phase-production-build'
            const { wpFetchItem } = await import('./client')
            expect(await wpFetchItem('/wp/v2/agency/7')).toBeNull()
            expect(fetchMock).not.toHaveBeenCalled()
        })
    })

    describe('wpFetch', () => {
        it('retorna o JSON quando a resposta é ok', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: async () => ({ id: 1, title: 'Teste' }),
            })
            const { wpFetch } = await import('./client')
            const result = await wpFetch('/wp/v2/production/1')
            expect(result).toEqual({ id: 1, title: 'Teste' })
        })

        it('monta a URL concatenando WP_API_URL com o path', async () => {
            fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
            const { wpFetch } = await import('./client')
            await wpFetch('/wp/v2/production?per_page=1')
            expect(fetchMock).toHaveBeenCalledWith(
                'https://wp.test/wp-json/wp/v2/production?per_page=1',
                expect.anything()
            )
        })

        it('passa revalidate e tags pro Next.js fetch cache', async () => {
            fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
            const { wpFetch } = await import('./client')
            await wpFetch('/wp/v2/production', { revalidate: 3600, tags: ['production-list'] })
            expect(fetchMock).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ next: { revalidate: 3600, tags: ['production-list'] } })
            )
        })

        // ── Prazo do fetch: build vs navegacao publica ───────────────────
        describe('prazo do fetch', () => {
            const comEnv = async (env: Record<string, string | undefined>) => {
                vi.resetModules()
                const antes = { ...process.env }
                Object.assign(process.env, env)
                const mod = await import('./config')
                const valor = mod.WP_FETCH_TIMEOUT_MS
                process.env = antes
                vi.resetModules()
                return valor
            }

            it('usa 10s na navegacao publica', async () => {
                expect(await comEnv({ NEXT_PHASE: undefined, WP_FETCH_TIMEOUT_MS: undefined })).toBe(10_000)
            })

            it('usa 45s no build, sem ninguem configurar nada', async () => {
                expect(await comEnv({ NEXT_PHASE: 'phase-production-build' })).toBe(45_000)
            })

            it('no build, nunca REDUZ um WP_FETCH_TIMEOUT_MS ja maior', async () => {
                expect(await comEnv({
                    NEXT_PHASE: 'phase-production-build',
                    WP_FETCH_TIMEOUT_MS: '90000',
                })).toBe(90_000)
            })

            it('WP_BUILD_FETCH_TIMEOUT_MS invalido cai no padrao de 45s', async () => {
                expect(await comEnv({
                    NEXT_PHASE: 'phase-production-build',
                    WP_BUILD_FETCH_TIMEOUT_MS: 'abc',
                })).toBe(45_000)
            })

            it('fora do build, o prazo do build e ignorado', async () => {
                expect(await comEnv({
                    NEXT_PHASE: undefined,
                    WP_BUILD_FETCH_TIMEOUT_MS: '90000',
                })).toBe(10_000)
            })
        })

        // ── Retentativa durante o build ──────────────────────────────────
        //
        // Cinco casos. Dois provam que ela ACONTECE; tres provam que ela NAO
        // acontece onde nao deve — em producao, em 404, e depois de dar certo.
        describe('retentativa durante o build', () => {
            const noBuild = async () => {
                vi.resetModules()
                process.env.NEXT_PHASE = 'phase-production-build'
                return (await import('./client')).wpFetch
            }
            const emProducao = async () => {
                vi.resetModules()
                delete process.env.NEXT_PHASE
                return (await import('./client')).wpFetch
            }

            afterEach(() => {
                delete process.env.NEXT_PHASE
                vi.resetModules()
            })

            it('repete apos timeout e devolve o resultado da segunda tentativa', async () => {
                fetchMock
                    .mockRejectedValueOnce(new Error('The operation was aborted due to timeout'))
                    .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 1 }], headers: { get: () => '1' } })
                const wpFetch = await noBuild()
                const r = await wpFetch('/wp/v2/production')
                expect(fetchMock).toHaveBeenCalledTimes(2)
                expect(r).not.toBeNull()
            })

            it('repete em 503 e desiste depois de 3 tentativas', async () => {
                fetchMock.mockResolvedValue({ ok: false, status: 503, statusText: 'Service Unavailable' })
                const wpFetch = await noBuild()
                await wpFetch('/wp/v2/production')
                expect(fetchMock).toHaveBeenCalledTimes(3)
            })

            it('NAO repete em 404 — resposta do servidor nao melhora repetindo', async () => {
                fetchMock.mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' })
                const wpFetch = await noBuild()
                await wpFetch('/wp/v2/production')
                expect(fetchMock).toHaveBeenCalledTimes(1)
            })

            it('NAO repete fora do build — navegacao publica falha rapido', async () => {
                fetchMock.mockRejectedValue(new Error('timeout'))
                const wpFetch = await emProducao()
                await wpFetch('/wp/v2/production')
                expect(fetchMock).toHaveBeenCalledTimes(1)
            })

            it('nao repete quando a primeira tentativa da certo', async () => {
                fetchMock.mockResolvedValue({ ok: true, json: async () => [], headers: { get: () => '0' } })
                const wpFetch = await noBuild()
                await wpFetch('/wp/v2/production')
                expect(fetchMock).toHaveBeenCalledTimes(1)
            })
        })

        // ── Piso de fetch-cache durante o build ──────────────────────────
        //
        // Quatro casos, e dois deles existem para provar que NADA muda: o piso
        // só vale na fase de build e nunca reduz nem sobrepõe o que o chamador
        // pediu. Ver WP_BUILD_FETCH_TTL_S em ./config.
        describe('piso de revalidate durante o build', () => {
            const comAmbiente = async (env: Record<string, string | undefined>) => {
                const antes = { ...process.env }
                Object.assign(process.env, env)
                vi.resetModules()
                const mod = await import('./client')
                return {
                    wpFetch: mod.wpFetch,
                    restaurar: () => {
                        process.env = antes
                        vi.resetModules()
                    },
                }
            }

            it('eleva o revalidate ao piso quando em build com TTL configurado', async () => {
                fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
                const { wpFetch, restaurar } = await comAmbiente({
                    NEXT_PHASE: 'phase-production-build',
                    WP_BUILD_FETCH_TTL_S: '21600',
                })
                await wpFetch('/wp/v2/production', { revalidate: 600, tags: ['t'] })
                expect(fetchMock).toHaveBeenCalledWith(
                    expect.any(String),
                    expect.objectContaining({ next: { revalidate: 21600, tags: ['t'] } })
                )
                restaurar()
            })

            it('nao REDUZ um revalidate que ja e maior que o piso', async () => {
                fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
                const { wpFetch, restaurar } = await comAmbiente({
                    NEXT_PHASE: 'phase-production-build',
                    WP_BUILD_FETCH_TTL_S: '3600',
                })
                await wpFetch('/wp/v2/production', { revalidate: 86400, tags: ['t'] })
                expect(fetchMock).toHaveBeenCalledWith(
                    expect.any(String),
                    expect.objectContaining({ next: { revalidate: 86400, tags: ['t'] } })
                )
                restaurar()
            })

            it('nao sobrepoe revalidate false (cache eterno segue eterno)', async () => {
                fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
                const { wpFetch, restaurar } = await comAmbiente({
                    NEXT_PHASE: 'phase-production-build',
                    WP_BUILD_FETCH_TTL_S: '21600',
                })
                await wpFetch('/wp/v2/production', { revalidate: false, tags: ['t'] })
                expect(fetchMock).toHaveBeenCalledWith(
                    expect.any(String),
                    expect.objectContaining({ next: { revalidate: false, tags: ['t'] } })
                )
                restaurar()
            })

            it('nao muda nada FORA da fase de build, mesmo com TTL configurado', async () => {
                fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
                const { wpFetch, restaurar } = await comAmbiente({
                    NEXT_PHASE: undefined,
                    WP_BUILD_FETCH_TTL_S: '21600',
                })
                await wpFetch('/wp/v2/production', { revalidate: 600, tags: ['t'] })
                expect(fetchMock).toHaveBeenCalledWith(
                    expect.any(String),
                    expect.objectContaining({ next: { revalidate: 600, tags: ['t'] } })
                )
                restaurar()
            })

            // O padrao e LIGADO (6h). Ausente e vazio caem nele; `0` desliga.
            //
            // A string vazia importa mais do que parece: o ARG do Dockerfile chega
            // assim quando ninguem o define, e `Number('')` e 0. Sem tratar,
            // o caminho normal do container cairia no desligado — o mesmo modo de
            // falhar que deixou a economia de gates do #35 inerte por dias.
            it('ausente, vazio ou invalido usam o padrao de 6h', async () => {
                for (const ttl of [undefined, '', '   ', 'abc']) {
                    fetchMock.mockClear()
                    fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
                    const { wpFetch, restaurar } = await comAmbiente({
                        NEXT_PHASE: 'phase-production-build',
                        WP_BUILD_FETCH_TTL_S: ttl,
                    })
                    await wpFetch('/wp/v2/production', { revalidate: 600, tags: ['productions'] })
                    expect(fetchMock).toHaveBeenCalledWith(
                        expect.any(String),
                        expect.objectContaining({ next: { revalidate: 21600, tags: ['productions'] } })
                    )
                    restaurar()
                }
            })

            it('`0` e `-5` desligam o piso explicitamente', async () => {
                for (const ttl of ['0', '-5']) {
                    fetchMock.mockClear()
                    fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
                    const { wpFetch, restaurar } = await comAmbiente({
                        NEXT_PHASE: 'phase-production-build',
                        WP_BUILD_FETCH_TTL_S: ttl,
                    })
                    await wpFetch('/wp/v2/production', { revalidate: 600, tags: ['productions'] })
                    expect(fetchMock).toHaveBeenCalledWith(
                        expect.any(String),
                        expect.objectContaining({ next: { revalidate: 600, tags: ['productions'] } })
                    )
                    restaurar()
                }
            })

            // ── Noticia fica FORA do piso ────────────────────────────────
            it('nao aplica o piso a fetch de noticia (tag de colecao e de item)', async () => {
                for (const tags of [['posts'], ['post-algum-slug'], ['posts', 'categories']]) {
                    fetchMock.mockClear()
                    fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
                    const { wpFetch, restaurar } = await comAmbiente({
                        NEXT_PHASE: 'phase-production-build',
                        WP_BUILD_FETCH_TTL_S: '21600',
                    })
                    await wpFetch('/wp/v2/posts', { revalidate: 600, tags })
                    expect(fetchMock).toHaveBeenCalledWith(
                        expect.any(String),
                        expect.objectContaining({ next: { revalidate: 600, tags } })
                    )
                    restaurar()
                }
            })

            // Guarda contra o bug obvio do prefixo: `productions` comeca com
            // "product", nao com "post-", e nao pode cair na excecao de noticia.
            it('aplica o piso a productions e production-<slug>, que NAO sao noticia', async () => {
                for (const tags of [['productions'], ['production-algum-slug'], ['artists']]) {
                    fetchMock.mockClear()
                    fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
                    const { wpFetch, restaurar } = await comAmbiente({
                        NEXT_PHASE: 'phase-production-build',
                        WP_BUILD_FETCH_TTL_S: '21600',
                    })
                    await wpFetch('/wp/v2/production', { revalidate: 600, tags })
                    expect(fetchMock).toHaveBeenCalledWith(
                        expect.any(String),
                        expect.objectContaining({ next: { revalidate: 21600, tags } })
                    )
                    restaurar()
                }
            })
        })

        it('usa revalidate padrão de 600s quando não especificado', async () => {
            fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
            const { wpFetch } = await import('./client')
            await wpFetch('/wp/v2/production')
            expect(fetchMock).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ next: expect.objectContaining({ revalidate: 600 }) })
            )
        })

        it('usa timeout curto de 10s por padrão para não bloquear a renderização', async () => {
            const timeoutSpy = vi.spyOn(AbortSignal, 'timeout')
            fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
            const { wpFetch } = await import('./client')
            await wpFetch('/wp/v2/production')
            expect(timeoutSpy).toHaveBeenCalledWith(10_000)
        })

        it('aceita timeout operacional configurável dentro do limite seguro', async () => {
            process.env.WP_FETCH_TIMEOUT_MS = '15000'
            const timeoutSpy = vi.spyOn(AbortSignal, 'timeout')
            fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
            const { wpFetch } = await import('./client')
            await wpFetch('/wp/v2/production')
            expect(timeoutSpy).toHaveBeenCalledWith(15_000)
        })

        it('retorna array vazio (não lança) quando a resposta não é ok', async () => {
            fetchMock.mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' })
            const { wpFetch } = await import('./client')
            const result = await wpFetch('/wp/v2/production/999')
            expect(result).toEqual([])
        })

        it('retorna array vazio (não lança) quando o fetch rejeita (rede fora do ar)', async () => {
            fetchMock.mockRejectedValue(new Error('fetch failed'))
            const { wpFetch } = await import('./client')
            const result = await wpFetch('/wp/v2/production')
            expect(result).toEqual([])
        })

        it('retorna array vazio quando o WordPress responde JSON inválido', async () => {
            fetchMock.mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError('invalid JSON') } })
            const { wpFetch } = await import('./client')
            const result = await wpFetch('/wp/v2/production')
            expect(result).toEqual([])
        })

        it('curto-circuita pra array vazio durante o build sem WORDPRESS_API_URL configurado', async () => {
            delete process.env.WORDPRESS_API_URL
            process.env.NEXT_PHASE = 'phase-production-build'
            const { wpFetch } = await import('./client')
            const result = await wpFetch('/wp/v2/production')
            expect(result).toEqual([])
            expect(fetchMock).not.toHaveBeenCalled()
        })
    })

    describe('wpFetchWithTotal', () => {
        it('retorna items + total + totalPages a partir dos headers X-WP-*', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: async () => [{ id: 1 }, { id: 2 }],
                headers: new Map([['X-WP-Total', '42'], ['X-WP-TotalPages', '5']]),
            })
            const { wpFetchWithTotal } = await import('./client')
            const result = await wpFetchWithTotal('/wp/v2/production')
            expect(result).toEqual({ items: [{ id: 1 }, { id: 2 }], total: 42, totalPages: 5 })
        })

        it('retorna estrutura vazia quando a resposta não é ok', async () => {
            fetchMock.mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' })
            const { wpFetchWithTotal } = await import('./client')
            const result = await wpFetchWithTotal('/wp/v2/production')
            expect(result).toEqual({ items: [], total: 0, totalPages: 0 })
        })

        it('retorna estrutura vazia quando o fetch rejeita', async () => {
            fetchMock.mockRejectedValue(new Error('network error'))
            const { wpFetchWithTotal } = await import('./client')
            const result = await wpFetchWithTotal('/wp/v2/production')
            expect(result).toEqual({ items: [], total: 0, totalPages: 0 })
        })

        it('trata headers ausentes como 0 (não NaN)', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: async () => [],
                headers: new Map(),
            })
            const { wpFetchWithTotal } = await import('./client')
            const result = await wpFetchWithTotal('/wp/v2/production')
            expect(result.total).toBe(0)
            expect(result.totalPages).toBe(0)
        })

        it('trata headers inválidos ou negativos como 0', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: async () => [],
                headers: new Map([['X-WP-Total', 'NaN'], ['X-WP-TotalPages', '-2']]),
            })
            const { wpFetchWithTotal } = await import('./client')
            const result = await wpFetchWithTotal('/wp/v2/production')
            expect(result).toEqual({ items: [], total: 0, totalPages: 0 })
        })
    })

    describe('wpFetchWithTotalForSitemap', () => {
        it('ignora IS_BUILD e faz fetch mesmo durante o build', async () => {
            delete process.env.WORDPRESS_API_URL
            process.env.NEXT_PHASE = 'phase-production-build'
            fetchMock.mockResolvedValue({
                ok: true,
                json: async () => [{ id: 1 }],
                headers: new Map([['X-WP-Total', '1'], ['X-WP-TotalPages', '1']]),
            })
            const { wpFetchWithTotalForSitemap } = await import('./client')
            const result = await wpFetchWithTotalForSitemap('/wp/v2/production')
            expect(fetchMock).toHaveBeenCalled()
            expect(result.items).toEqual([{ id: 1 }])
        })

        it('faz retry com backoff exponencial em erro, até o limite de 5 tentativas', async () => {
            vi.useFakeTimers()
            fetchMock.mockResolvedValue({ ok: false, status: 503, statusText: 'Unavailable' })
            const { wpFetchWithTotalForSitemap } = await import('./client')
            const pending = wpFetchWithTotalForSitemap('/wp/v2/production')
            await vi.runAllTimersAsync()
            const result = await pending
            // 1 tentativa inicial + 5 retries = 6 chamadas de fetch
            expect(fetchMock).toHaveBeenCalledTimes(6)
            expect(result).toEqual({ items: [], total: 0, totalPages: 0 })
            vi.useRealTimers()
        })

        it('recupera com sucesso após uma falha transitória', async () => {
            vi.useFakeTimers()
            fetchMock
                .mockResolvedValueOnce({ ok: false, status: 503, statusText: 'Unavailable' })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [{ id: 1 }],
                    headers: new Map([['X-WP-Total', '1'], ['X-WP-TotalPages', '1']]),
                })
            const { wpFetchWithTotalForSitemap } = await import('./client')
            const pending = wpFetchWithTotalForSitemap('/wp/v2/production')
            await vi.runAllTimersAsync()
            const result = await pending
            expect(fetchMock).toHaveBeenCalledTimes(2)
            expect(result.items).toEqual([{ id: 1 }])
            vi.useRealTimers()
        })
    })

    describe('buildParams', () => {
        it('monta query string a partir de um objeto', async () => {
            const { buildParams } = await import('./client')
            expect(buildParams({ per_page: 10, orderby: 'date' })).toBe('?per_page=10&orderby=date')
        })

        it('omite chaves com valor undefined ou string vazia', async () => {
            const { buildParams } = await import('./client')
            expect(buildParams({ per_page: 10, search: undefined, status: '' })).toBe('?per_page=10')
        })

        it('retorna string vazia quando não há nenhum parâmetro válido', async () => {
            const { buildParams } = await import('./client')
            expect(buildParams({ search: undefined })).toBe('')
        })

        it('inclui valores booleanos e zero (só exclui undefined/string vazia)', async () => {
            const { buildParams } = await import('./client')
            expect(buildParams({ featured: false, page: 0 })).toBe('?featured=false&page=0')
        })
    })
})
