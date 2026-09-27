import Link from 'next/link'

const H2 = 'font-[family-name:var(--font-playfair)] text-[26px] font-extrabold leading-tight sm:text-[30px]'

/** Texto de apoio do /quiz: explica o jogo para quem chega pelo Google e responde as dúvidas mais comuns. */
export const PERGUNTAS_QUIZ = [
    { p: 'O quiz é grátis?', r: 'Sim. O jogo do HallyuHub é gratuito e não exige cadastro: basta escolher um tema e o nível e jogar.' },
    { p: 'Quantas perguntas tem o quiz?', r: 'Cada partida tem 15 perguntas sorteadas de um banco com mais de 300, sobre K-Pop, K-Drama, cultura e história da Coreia. Há também uma pergunta nova todo dia.' },
    { p: 'Como funciona a pontuação?', r: 'Cada acerto vale pontos e quem responde mais rápido ganha um bônus de tempo. Acertar três seguidas dá bônus de sequência. Os níveis Iniciante, Intermediário e Expert mudam o tempo por pergunta e o teto de pontos.' },
    { p: 'Minhas estatísticas ficam salvas?', r: 'Se você permitir cookies, o placar, as estatísticas e a sequência de dias ficam guardados neste navegador. Sem permissão, o quiz funciona igual, só não lembra de você na próxima visita.' },
]

export function QuizSobre() {
    return (
        <section aria-labelledby="quiz-sobre" className="mt-14 max-w-3xl space-y-8 text-[16px] leading-relaxed">
            <div>
                <h2 id="quiz-sobre" className={H2}>Quiz de K-Pop e K-Drama: teste seus conhecimentos</h2>
                <p className="mt-3">O quiz do HallyuHub reúne perguntas sobre os grupos de K-Pop, os doramas mais assistidos, a culinária, o idioma e a história da Coreia. É um jeito rápido de descobrir quanto você sabe sobre a onda coreana e de aprender algo novo a cada resposta: depois de cada pergunta aparece uma explicação curta, muitas vezes com um link para a ficha do artista, do grupo ou da produção.</p>
            </div>
            <div>
                <h2 className={H2}>Escolha o seu tema</h2>
                <p className="mt-3">No tema <strong>K-Pop</strong> você responde sobre grupos, idols, músicas e comebacks. No tema <strong>K-Drama</strong>, sobre séries, elencos e clássicos. Os temas de <strong>cultura</strong> e <strong>história</strong> cobrem comida, língua, festividades e a Coreia de Joseon até hoje. Prefere variedade? O modo &quot;Tudo misturado&quot; sorteia perguntas de todos os temas.</p>
                <p className="mt-3">Quer testar o que sabe sobre a sua torcida? Veja a página dos <Link href="/fandoms" className="font-bold underline">fandoms de K-Pop</Link>, escolha a sua e faça o quiz do grupo.</p>
            </div>
            <div>
                <h2 className={H2}>Perguntas frequentes sobre o quiz</h2>
                <dl className="mt-4 space-y-4">
                    {PERGUNTAS_QUIZ.map(({ p, r }) => (
                        <div key={p}><dt className="font-black">{p}</dt><dd className="mt-1">{r}</dd></div>
                    ))}
                </dl>
            </div>
        </section>
    )
}
