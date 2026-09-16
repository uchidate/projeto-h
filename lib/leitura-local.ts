/**
 * Memória local do que este visitante já leu.
 *
 * ── Por que existe ──────────────────────────────────────────────────────────
 *
 * O bloco "Sugerido para você" recomendava por similaridade de conteúdo —
 * grupo protagonista, tags, categoria. Boa lógica, mas igual para todo mundo:
 * não havia nenhum "você" na conta, e o rótulo prometia o que não entregava.
 *
 * Com esta lista, a sugestão passa a pular o que a pessoa já leu. É a
 * personalização mais barata que existe e a que mais incomoda quando falta:
 * ser recomendado a reler o artigo que se acabou de terminar.
 *
 * ── Por que fica só no navegador ────────────────────────────────────────────
 *
 * Nada disso vai para servidor nenhum. É preferência de leitura, não
 * identidade: guardar no cliente dispensa consentimento, dispensa banco e
 * dispensa a conversa sobre retenção de dado pessoal. O custo é a lista não
 * seguir a pessoa entre dispositivos — troca aceitável para o que ela entrega.
 */

const CHAVE = 'hh-lidos-v1'

/**
 * Teto de slugs guardados.
 *
 * localStorage costuma ter ~5 MB por origem e é COMPARTILHADO com tudo que a
 * página guarda. Uma lista sem limite cresceria para sempre e um dia estouraria
 * a cota — derrubando, junto, o consentimento e as preferências que moram no
 * mesmo lugar. Cem leituras cobrem meses de uso de um leitor assíduo.
 */
const MAXIMO = 100

function ler(): string[] {
    if (typeof window === 'undefined') return []
    try {
        const bruto = window.localStorage.getItem(CHAVE)
        if (!bruto) return []
        const dados: unknown = JSON.parse(bruto)
        // Valida em vez de confiar: o conteúdo é do navegador do visitante e
        // pode ter sido escrito por uma versão anterior, por outra aba ou à mão.
        return Array.isArray(dados) ? dados.filter((x): x is string => typeof x === 'string') : []
    } catch {
        // Modo privado, cota estourada ou JSON corrompido. Lista vazia degrada
        // para o comportamento anterior — nunca para erro.
        return []
    }
}

/** Slugs já lidos, para consulta rápida. */
export function slugsLidos(): Set<string> {
    return new Set(ler())
}

/**
 * Registra uma leitura.
 *
 * Chamado só quando o leitor passa do limiar de atenção do `RastreioDeLeitura`,
 * não ao abrir a página: abrir e sair em dois segundos não é leitura, e tratar
 * como tal esconderia justamente o artigo que a pessoa quis ler e não leu.
 */
export function registrarLeitura(slug: string): void {
    if (typeof window === 'undefined' || !slug) return
    try {
        const atual = ler().filter((s) => s !== slug)
        // Mais recente na frente: o corte pelo fim descarta o mais antigo.
        const novo = [slug, ...atual].slice(0, MAXIMO)
        window.localStorage.setItem(CHAVE, JSON.stringify(novo))
    } catch {
        // Sem persistência a sugestão volta a ser só por similaridade. É pior,
        // e ainda assim é melhor que quebrar a página do visitante.
    }
}
