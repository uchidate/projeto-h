import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Trophy, ArrowRight, Lightbulb } from 'lucide-react'
import { MiniQuiz } from './MiniQuiz'
import { getQuizQuestions } from '@/lib/wordpress/quiz'
import { quizCategoryTone } from '@/lib/quiz/categoryMeta'

const diaDoAno = () => Math.floor(Date.now() / 86400000)

interface Props {
    entitySlug: string   // ex: "iu", "bts", "my-misterious-girl"
    entityType: 'artist' | 'group' | 'production' | 'agency'
    entityName: string
    entityId?: number
    /** Só para entityType="agency": junta as perguntas de todos os grupos/artistas do roster. */
    groupIds?: number[]
    artistIds?: number[]
}

export async function QuizFacts({ entitySlug, entityType, entityName, entityId, groupIds, artistIds }: Props) {
    const t = await getTranslations('profile.ui')
    const path = entityType === 'artist' ? `/artists/${entitySlug}`
        : entityType === 'group' ? `/groups/${entitySlug}`
        : entityType === 'production' ? `/productions/${entitySlug}`
        : null

    const allQuestions = await getQuizQuestions()

    // Perguntas ligadas à entidade (por link do post ou pelos vínculos do quiz)
    const chave = entityType === 'artist' ? 'artists' : entityType === 'group' ? 'groups' : 'productions'
    // Pergunta cuja resposta é a própria entidade entrega a resposta na página dela.
    const norm = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    const nome = norm(entityName)
    const entregaResposta = (q: { options: string[]; correct: number }) => {
        const certa = norm(q.options[q.correct] ?? '')
        return certa.length >= 3 && (certa === nome || certa.includes(nome) || nome.includes(certa))
    }
    // "Direta": a pergunta fala da própria entidade (relatedHref apontando pra
    // esta página, ou vínculo explícito no admin do quiz). "Indireta" (só pra
    // agência): pergunta sobre QUALQUER artista/grupo do roster, não sobre a
    // agência em si — menos familiar ao que a página está mostrando.
    const direta = (q: (typeof allQuestions)[number]) =>
        q.relatedHref?.includes(path!) || (entityId != null && q.links?.[chave].includes(entityId))
    const indiretaAgencia = (q: (typeof allQuestions)[number]) =>
        (groupIds?.some(id => q.links?.groups.includes(id)) ?? false) || (artistIds?.some(id => q.links?.artists.includes(id)) ?? false)

    const elegiveis = allQuestions
        .filter(q => !entregaResposta(q))
        .filter(q => entityType === 'agency' ? indiretaAgencia(q) : direta(q))
        // Perguntas diretas sobre a própria entidade vêm primeiro — mais familiares
        // ao que a ficha já mostra do que uma pergunta genérica do roster da agência.
        .sort((a, b) => Number(direta(b)) - Number(direta(a)))

    if (elegiveis.length === 0) return null

    // Rotação determinística dentro de cada grupo de relevância (direta vs.
    // indireta) — mesmo resultado dentro do ciclo de cache (ISR), muda por
    // entidade e a cada dia, mas nunca empurra uma pergunta direta pra fora
    // da seleção só por causa do rodízio.
    const diretas = elegiveis.filter(direta)
    const indiretas = elegiveis.filter(q => !direta(q))
    const semente = (entityId ?? entitySlug.split('').reduce((h, c) => h + c.charCodeAt(0), 0)) + diaDoAno()
    const QUANTIDADE = 5
    const rotacionar = <T,>(lista: T[], n: number) =>
        lista.length <= n ? lista : Array.from({ length: n }, (_, k) => lista[(semente + k) % lista.length])

    const facts = diretas.length >= QUANTIDADE
        ? rotacionar(diretas, QUANTIDADE)
        : [...diretas, ...rotacionar(indiretas, QUANTIDADE - diretas.length)]

    const categoria = facts[0]?.category
    const tone = quizCategoryTone(categoria)
    const quizHref = `/quiz/${categoria ?? 'k-pop'}`

    return (
        <section className="border-t border-border/40 page-wrap py-8">
            <div className="flex items-center gap-2 mb-4">
                <div className={`flex h-6 w-6 items-center justify-center ${tone.bg}`}>
                    <Lightbulb className={`w-3.5 h-3.5 ${tone.text}`} />
                </div>
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-muted">
                    Teste o que você sabe · {entityName}
                </p>
            </div>

            <MiniQuiz
                items={facts.map(({ id, question, options, correct, explanation, relatedHref, relatedLabel }) => ({
                    id, question, options, correct, explanation,
                    // Sem link pra própria página: a ficha que já está aberta não é "saiba mais".
                    relatedHref: relatedHref && relatedHref !== path ? relatedHref : undefined,
                    relatedLabel: relatedLabel ?? undefined,
                }))}
                entityName={entityName} quizHref={quizHref} tone={tone}
            />

            <Link href={quizHref}
                className={`mt-4 inline-flex items-center gap-2 text-[11px] font-black hover:underline ${tone.text}`}>
                <Trophy className="w-3.5 h-3.5" />
                {t('quiz.testKnowledge')}
                <ArrowRight className="w-3.5 h-3.5" />
            </Link>
        </section>
    )
}
