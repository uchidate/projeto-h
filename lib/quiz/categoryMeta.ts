/**
 * Paleta por categoria do quiz, compartilhada entre QuizWidget, QuizFacts/MiniQuiz
 * e a própria página /quiz — antes duplicada em dois arquivos com valores
 * ligeiramente diferentes. Cada bloco de quiz embutido numa ficha (artista, grupo,
 * produção...) herda a cor da categoria das perguntas que está mostrando, em vez
 * de usar sempre o acento global do site.
 */
export type QuizCategorySlug = 'k-pop' | 'k-drama' | 'cultura' | 'historia'

export type QuizCategoryTone = { label: string; text: string; border: string; hoverBorder: string; bg: string }

// Classes escritas por extenso (não montadas em runtime): o scanner do Tailwind
// só gera CSS para o literal que aparece no texto do arquivo.
export const QUIZ_CATEGORY_META: Record<QuizCategorySlug, QuizCategoryTone> = {
    'k-pop':    { label: 'K-Pop',    text: 'text-pink-400',   border: 'border-pink-500/40',   hoverBorder: 'hover:border-pink-500/60',   bg: 'bg-pink-500/10' },
    'k-drama':  { label: 'K-Drama',  text: 'text-blue-400',   border: 'border-blue-500/40',   hoverBorder: 'hover:border-blue-500/60',   bg: 'bg-blue-500/10' },
    'cultura':  { label: 'Cultura',  text: 'text-purple-400', border: 'border-purple-500/40', hoverBorder: 'hover:border-purple-500/60', bg: 'bg-purple-500/10' },
    'historia': { label: 'História', text: 'text-amber-400',  border: 'border-amber-500/40',  hoverBorder: 'hover:border-amber-500/60',  bg: 'bg-amber-500/10' },
}

const FALLBACK: QuizCategoryTone = { label: 'Hallyu', text: 'text-accent', border: 'border-accent/40', hoverBorder: 'hover:border-accent/60', bg: 'bg-accent/10' }

export function quizCategoryTone(category?: string | null): QuizCategoryTone {
    return (category && QUIZ_CATEGORY_META[category as QuizCategorySlug]) || FALLBACK
}

/** Categoria do blog (slug do CPT category) → categoria do quiz, pro banner da listagem/artigo usar a cor certa. */
const BLOG_TO_QUIZ_CATEGORY: Record<string, QuizCategorySlug> = {
    'k-pop':       'k-pop',
    'k-drama':     'k-drama',
    'dorama':      'k-drama',
    'cultura':     'cultura',
    'gastronomia': 'cultura',
    'historia':    'historia',
    'k-film':      'k-drama',
}

export function quizCategoryFromBlog(categorySlug?: string | null): QuizCategorySlug {
    return BLOG_TO_QUIZ_CATEGORY[categorySlug ?? ''] ?? 'k-pop'
}
