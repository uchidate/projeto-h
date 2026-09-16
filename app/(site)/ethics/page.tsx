import type { Metadata } from 'next'
import { SITE_NAME, SITE_URL } from '@/lib/constants/site'

export const metadata: Metadata = {
    title: 'Código de Ética',
    description: `Princípios editoriais e de independência do ${SITE_NAME}.`,
    alternates: { canonical: `${SITE_URL}/ethics` },
}

export default function EthicsPage() {
    return (
        <div className="page-wrap py-12 max-w-2xl">
            <h1 className="text-[36px] font-black mb-6 text-foreground">Código de Ética</h1>
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4 text-[15px] text-foreground leading-relaxed">
                <p>
                    O {SITE_NAME} cobre cultura pop coreana com foco em informação, contexto e
                    utilidade para leitores em português. Nosso compromisso é separar fato,
                    análise, opinião e material patrocinado.
                </p>
                <h2 className="text-[20px] font-black mt-8 mb-3">Independência editorial</h2>
                <p>
                    Pautas, títulos e recomendações editoriais devem responder ao interesse do
                    leitor. Quando houver parceria, publicidade, afiliado ou apoio comercial, isso
                    deve ser identificado de forma clara.
                </p>
                <h2 className="text-[20px] font-black mt-8 mb-3">Precisão</h2>
                <ul className="list-disc list-inside space-y-2 text-muted">
                    <li>Não publicamos acusações sensíveis sem cautela editorial e base verificável.</li>
                    <li>Não apresentamos rumor como fato confirmado.</li>
                    <li>Não usamos título ou descrição que prometa informação ausente no texto.</li>
                    <li>Evitamos especulação sobre vida privada, saúde ou aparência sem relevância pública clara.</li>
                </ul>
                <h2 className="text-[20px] font-black mt-8 mb-3">Conflitos e patrocínios</h2>
                <p>
                    Conteúdo patrocinado, publieditorial, links comerciais ou qualquer relação que
                    possa influenciar a cobertura deve ser sinalizada ao leitor no próprio conteúdo.
                </p>
            </div>
        </div>
    )
}
