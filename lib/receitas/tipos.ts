// Modo de preparo de uma receita do CPT food. Fica no repo (data/receitas.json)
// porque o WordPress não tem esses campos e o Google exige que o schema
// Recipe corresponda ao conteúdo visível na página.
export type IngredienteReceita = { item: string; quantidade: string }

export type FonteReceita = { nome: string; url: string }

export type Receita = {
    /** Porções que a receita rende (número, para recipeYield). */
    porcoes: number
    preparoMin: number
    cozimentoMin: number
    ingredientes: IngredienteReceita[]
    passos: string[]
    dicas?: string[]
    /** Fontes cruzadas para quantidades e tempos; o texto é redação própria. */
    fontes: FonteReceita[]
    /** Data (AAAA-MM-DD) em que as fontes foram conferidas. */
    conferidoEm: string
}
