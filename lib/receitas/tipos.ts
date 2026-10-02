// Modo de preparo de uma receita do CPT food. Fica no repo (data/receitas.json)
// porque o WordPress não tem esses campos e o Google exige que o schema
// Recipe corresponda ao conteúdo visível na página.
type IngredienteReceita = { item: string; quantidade: string }

type FonteReceita = { nome: string; url: string }

export type Receita = {
    /** Porções que a receita rende (número inteiro). */
    porcoes: number
    /** Texto do rendimento quando 'porções' não descreve bem (ex.: "5 rolos"). */
    rendimento?: string
    /** Preparo ativo + tempos passivos (marinar, crescer, deixar de molho). */
    preparoMin: number
    cozimentoMin: number
    ingredientes: IngredienteReceita[]
    passos: string[]
    dicas?: string[]
    /**
     * fontes[0] é a BASE das quantidades e dos tempos; as demais conferem
     * técnica e ordem de grandeza. O texto dos passos é redação própria.
     */
    fontes: FonteReceita[]
    /** Data (AAAA-MM-DD) em que as fontes foram conferidas. */
    conferidoEm: string
}
