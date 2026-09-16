import type { Metadata } from 'next'
import { SITE_NAME, SITE_URL } from '@/lib/constants/site'

export const metadata: Metadata = {
    title: 'Política de Correções',
    description: `Como o ${SITE_NAME} corrige informações, atualiza matérias e registra ajustes editoriais.`,
    alternates: { canonical: `${SITE_URL}/corrections` },
}

export default function CorrectionsPage() {
    return (
        <div className="page-wrap py-12 max-w-2xl">
            <h1 className="text-[36px] font-black mb-6 text-foreground">Política de Correções</h1>
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4 text-[15px] text-foreground leading-relaxed">
                <p>
                    O {SITE_NAME} corrige erros factuais, nomes, datas, cargos, títulos, números,
                    links e informações de contexto sempre que identifica uma inconsistência ou
                    recebe uma solicitação procedente de correção.
                </p>
                <h2 className="text-[20px] font-black mt-8 mb-3">Como solicitar correção</h2>
                <p>
                    Envie a URL da matéria, o trecho que precisa de revisão e a fonte que sustenta
                    a correção pelo nosso <a href="/contato" className="text-accent hover:underline">formulário de contato</a>.
                </p>
                <h2 className="text-[20px] font-black mt-8 mb-3">Como corrigimos</h2>
                <ul className="list-disc list-inside space-y-2 text-muted">
                    <li>Erros simples de grafia, romanização ou formatação podem ser corrigidos diretamente.</li>
                    <li>Erros factuais relevantes são revisados contra fontes disponíveis antes da alteração.</li>
                    <li>Quando uma correção altera a compreensão da matéria, o texto deve indicar que foi atualizado.</li>
                    <li>Não alteramos datas de publicação apenas para simular atualidade.</li>
                </ul>
                <h2 className="text-[20px] font-black mt-8 mb-3">Atualizações</h2>
                <p>
                    Matérias de notícia podem receber atualizações quando surgem novas informações
                    verificáveis. Guias, perfis e reviews podem ser revisados periodicamente para
                    manter dados e links úteis ao leitor.
                </p>
            </div>
        </div>
    )
}
