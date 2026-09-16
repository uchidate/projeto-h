import { getQuizQuestions } from '@/lib/wordpress/quiz'
import type { QuizCategory } from '@/lib/wordpress/quiz'
import { QuizEmbed } from './QuizEmbed'

interface Props {
    category: QuizCategory
    count?: number
}

export async function QuizEmbedLoader({ category, count = 5 }: Props) {
    const allQuestions = await getQuizQuestions({ category })
    if (allQuestions.length === 0) return null

    // Seleciona `count` perguntas aleatórias mas determinísticas para ISR
    const seed = allQuestions.length
    const selected = allQuestions
        .filter(q => q.difficulty !== 'hard')
        .sort((a, b) => ((a.id * seed) % 97) - ((b.id * seed) % 97))
        .slice(0, count)

    if (selected.length < 3) return null

    return <QuizEmbed questions={selected} category={category} />
}
