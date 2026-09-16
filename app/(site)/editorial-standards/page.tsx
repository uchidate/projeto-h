import type { Metadata } from 'next'
import { SITE_NAME, SITE_URL } from '@/lib/constants/site'

export const metadata: Metadata = {
    title: 'Padrões Editoriais',
    description: `Padrões editoriais do ${SITE_NAME}: notícias, guias, reviews, fontes, correções e uso de IA.`,
    alternates: { canonical: `${SITE_URL}/editorial-standards` },
}

export default function EditorialStandardsPage() {
    return (
        <div className="page-wrap py-12 max-w-2xl">
            <h1 className="text-[36px] font-black mb-6 text-foreground">Padrões Editoriais</h1>
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4 text-[15px] text-foreground leading-relaxed">
                <p>
                    O {SITE_NAME} publica notícias, análises, guias, reviews e perfis sobre K-pop,
                    K-drama e cultura coreana. Cada formato tem uma função editorial diferente.
                </p>
                <h2 className="text-[20px] font-black mt-8 mb-3">Notícias</h2>
                <p>
                    Matérias jornalísticas devem abrir com o fato principal, identificar nomes,
                    datas, obras, empresas e números relevantes, e separar informação confirmada de
                    leitura editorial. Notícias não devem usar tom promocional nem esconder a origem
                    factual do assunto.
                </p>
                <h2 className="text-[20px] font-black mt-8 mb-3">Guias, reviews e perfis</h2>
                <p>
                    Conteúdos evergreen podem ter leitura mais analítica, mas ainda precisam manter
                    precisão, contexto e clareza. Reviews devem indicar quando há avaliação
                    editorial. Perfis devem evitar especulação e priorizar dados verificáveis.
                </p>
                <h2 className="text-[20px] font-black mt-8 mb-3">Fontes e atribuição</h2>
                <p>
                    Sempre que possível, damos preferência a fontes primárias, comunicados oficiais,
                    dados de plataformas, páginas de artistas, empresas, charts e informações
                    públicas verificáveis. Quando uma informação ainda estiver em desenvolvimento, o
                    texto deve evitar conclusões definitivas.
                </p>
                <h2 className="text-[20px] font-black mt-8 mb-3">Uso de IA</h2>
                <p>
                    O {SITE_NAME} pode usar ferramentas de inteligência artificial como apoio em
                    pesquisa, organização de pauta, revisão, tradução preliminar, estruturação de
                    rascunhos e checagens editoriais. Conteúdos publicados devem passar por revisão
                    editorial antes da publicação. IA não deve ser usada para inventar fontes,
                    citações, números, falas ou fatos.
                </p>
                <h2 className="text-[20px] font-black mt-8 mb-3">Correções</h2>
                <p>
                    Correções seguem a nossa <a href="/corrections" className="text-accent hover:underline">Política de Correções</a>.
                    Solicitações podem ser enviadas pela página de <a href="/contato" className="text-accent hover:underline">Contato</a>.
                </p>
            </div>
        </div>
    )
}
