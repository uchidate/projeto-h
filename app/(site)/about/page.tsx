import type { Metadata } from 'next'
import { SITE_NAME, SITE_URL } from '@/lib/constants/site'

export const metadata: Metadata = {
    title: 'Sobre',
    description: `Conheça o ${SITE_NAME}, seu portal de K-Drama, K-Pop e cultura coreana em português.`,
    alternates: { canonical: `${SITE_URL}/about` },
}

export default function AboutPage() {
    return (
        <>
        <div className="page-wrap py-12 max-w-2xl">
            <h1 className="text-[36px] font-black mb-6 text-foreground">Sobre o {SITE_NAME}</h1>
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4 text-[15px] text-foreground leading-relaxed">
                <p>
                    O <strong>{SITE_NAME}</strong> é um portal brasileiro dedicado à cultura pop coreana —
                    doramas, filmes, K-Pop, artistas e grupos — tudo em português, feito para o fandom nacional.
                </p>
                <p>
                    Nosso objetivo é ser a referência em conteúdo Hallyu no Brasil: catálogo completo de produções
                    com fichas técnicas detalhadas, perfis de artistas e grupos, artigos editoriais e guias
                    para quem está começando no universo coreano.
                </p>
                <h2 className="text-[20px] font-black mt-8 mb-3">O que você encontra aqui</h2>
                <ul className="list-disc list-inside space-y-2 text-muted">
                    <li>Catálogo de doramas e filmes coreanos com notas e informações técnicas</li>
                    <li>Perfis de artistas e grupos K-Pop</li>
                    <li>Artigos, reviews e guias para iniciantes</li>
                    <li>Notícias e atualizações sobre lançamentos, charts, turnês e tendências do Hallyu</li>
                </ul>
                <h2 className="text-[20px] font-black mt-8 mb-3">Transparência editorial</h2>
                <p>
                    Nossa cobertura combina notícias, guias, reviews e perfis. Para entender como
                    classificamos conteúdos, corrigimos informações e usamos ferramentas editoriais,
                    consulte nossos{' '}
                    <a href="/editorial-standards" className="text-accent hover:underline">padrões editoriais</a>,{' '}
                    <a href="/ethics" className="text-accent hover:underline">código de ética</a> e{' '}
                    <a href="/corrections" className="text-accent hover:underline">política de correções</a>.
                </p>
                <h2 className="text-[20px] font-black mt-8 mb-3">Contato</h2>
                <p>
                    Tem sugestões, correções ou quer colaborar? Entre em contato pelo nosso{' '}
                    <a href="/contato" className="text-accent hover:underline">formulário de contato</a>.
                </p>
            </div>
        </div>
        </>
    )
}
