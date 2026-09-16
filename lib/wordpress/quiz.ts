import { wpBuscarOpcional, wpFetchWithTotal } from './client'

export type QuizDifficulty = 'easy' | 'medium' | 'hard'
export type QuizCategory = 'k-pop' | 'k-drama' | 'cultura' | 'historia'

export type QuizSubcategory =
    // k-pop
    | 'grupos' | 'idols' | 'musicas' | 'comebacks'
    // k-drama
    | 'romance' | 'thriller' | 'classicos' | 'cinema'
    // cultura
    | 'gastronomia' | 'lingua' | 'festividades'
    // historia
    | 'antiga' | 'moderna'

export const SUBCATEGORY_MAP: Record<QuizCategory, Array<{ value: QuizSubcategory; label: string; sub: string }>> = {
    'k-pop': [
        { value: 'grupos',    label: 'Grupos',    sub: 'Girl groups e boy groups' },
        { value: 'idols',     label: 'Idols',     sub: 'Artistas e membros'       },
        { value: 'musicas',   label: 'Músicas',   sub: 'Hits e álbuns'            },
        { value: 'comebacks', label: 'Comebacks', sub: 'Lançamentos recentes'     },
    ],
    'k-drama': [
        { value: 'romance',   label: 'Romance',   sub: 'Doramas românticos'  },
        { value: 'thriller',  label: 'Thriller',  sub: 'Suspense e ação'     },
        { value: 'classicos', label: 'Clássicos', sub: 'Séries históricas'   },
        { value: 'cinema',    label: 'Cinema',    sub: 'Filmes coreanos'     },
    ],
    'cultura': [
        { value: 'gastronomia',  label: 'Comida',       sub: 'Culinária coreana'   },
        { value: 'lingua',       label: 'Língua',       sub: 'Hangul e expressões' },
        { value: 'festividades', label: 'Festividades', sub: 'Festivais e datas'   },
    ],
    'historia': [
        { value: 'antiga',  label: 'Antiga',  sub: 'Joseon e antes'   },
        { value: 'moderna', label: 'Moderna', sub: 'Séc. XX até hoje' },
    ],
}

export interface QuizQuestion {
    id: number
    question: string
    options: string[]
    correct: number
    explanation: string
    category: QuizCategory
    subcategory?: QuizSubcategory | ''
    difficulty: QuizDifficulty
    relatedHref?: string | null
    relatedLabel?: string | null
}

// Campos expostos via register_rest_field no nível raiz da resposta REST
interface WPQuizQuestion {
    id: number
    subcategory?: string
    question?: string
    option_a?: string; option_b?: string; option_c?: string; option_d?: string
    correct_option?: string; explanation?: string
    category?: string; difficulty?: string
    related_post_url?: string; related_post_label?: string
}

const CORRECT_MAP: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 }

// Normaliza variantes com acento para o tipo canônico
const CATEGORY_NORMALIZE: Record<string, QuizCategory> = {
    'k-pop': 'k-pop',
    'k-drama': 'k-drama',
    'cultura': 'cultura',
    'historia': 'historia',
    'história': 'historia',
}

function normalize(raw: WPQuizQuestion): QuizQuestion {
    const rawCat = (raw.category ?? '').toLowerCase().trim()
    const category: QuizCategory = CATEGORY_NORMALIZE[rawCat] ?? 'k-pop'
    return {
        id: raw.id,
        question: raw.question ?? '',
        options: [raw.option_a ?? '', raw.option_b ?? '', raw.option_c ?? '', raw.option_d ?? ''],
        correct: CORRECT_MAP[raw.correct_option ?? 'a'] ?? 0,
        explanation: raw.explanation ?? '',
        category,
        subcategory: (raw.subcategory || '') as QuizSubcategory | '',
        difficulty: (raw.difficulty ?? 'medium') as QuizDifficulty,
        relatedHref: raw.related_post_url || null,
        relatedLabel: raw.related_post_label || null,
    }
}

const FIELDS = 'id,question,option_a,option_b,option_c,option_d,correct_option,explanation,category,difficulty,subcategory,related_post_url,related_post_label'

export async function getQuizQuestions(opts?: {
    category?: QuizCategory
    difficulty?: QuizDifficulty
}): Promise<QuizQuestion[]> {
    const base = `/wp/v2/quiz_question?per_page=100&_fields=${FIELDS}&orderby=id`

    // Busca página 1 para descobrir total de páginas
    const { items: page1, totalPages } = await wpFetchWithTotal<WPQuizQuestion>(
        `${base}&page=1`,
        { revalidate: 3600 }
    )

    // Busca páginas restantes em paralelo
    const all: WPQuizQuestion[] = [...page1]
    if (totalPages > 1) {
        const extraPages = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) =>
                wpBuscarOpcional<WPQuizQuestion[]>(`${base}&page=${i + 2}`, { revalidate: 3600 })
            )
        )
        for (const page of extraPages) for (const item of page) all.push(item)
    }
    const questions = all.map(normalize).filter(q => q.question && q.options.every(Boolean))

    if (opts?.category) return questions.filter(q => q.category === opts.category)
    if (opts?.difficulty) return questions.filter(q => q.difficulty === opts.difficulty)
    return questions
}
