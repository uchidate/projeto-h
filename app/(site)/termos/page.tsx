import type { Metadata } from 'next'
import { SITE_NAME, SITE_URL } from '@/lib/constants/site'

export const metadata: Metadata = {
    title: 'Termos de Uso',
    alternates: { canonical: `${SITE_URL}/termos` },
}

export default function TermosPage() {
    return (
        <>
        <div className="page-wrap py-12 max-w-2xl">
            <h1 className="text-[36px] font-black mb-2 text-foreground">Termos de Uso</h1>
            <p className="text-[13px] text-muted mb-8">Última atualização: 18 de junho de 2026</p>
            <div className="space-y-6 text-[15px] text-foreground leading-relaxed">
                <section>
                    <h2 className="text-[18px] font-bold mb-2">1. Uso do conteúdo</h2>
                    <p className="text-muted">O conteúdo editorial do {SITE_NAME} (artigos, reviews, fichas técnicas) é de propriedade do site. Reprodução parcial é permitida com atribuição e link para a fonte original. Reprodução total sem autorização é proibida.</p>
                </section>
                <section>
                    <h2 className="text-[18px] font-bold mb-2">2. Imagens</h2>
                    <p className="text-muted">Imagens de artistas, grupos e produções são utilizadas para fins informativos e jornalísticos. Caso você seja detentor de direitos e queira solicitar remoção, entre em <a href="/contato" className="text-accent hover:underline">contato</a>.</p>
                </section>
                <section>
                    <h2 className="text-[18px] font-bold mb-2">3. Isenção de responsabilidade</h2>
                    <p className="text-muted">O {SITE_NAME} é um site de fãs e não tem afiliação oficial com agências, artistas ou distribuidoras coreanas. As informações são fornecidas de boa-fé e podem conter imprecisões.</p>
                </section>
                <section>
                    <h2 className="text-[18px] font-bold mb-2">4. Contato</h2>
                    <p className="text-muted">Dúvidas ou solicitações: <a href="/contato" className="text-accent hover:underline">formulário de contato</a>.</p>
                </section>
            </div>
        </div>
        </>
    )
}
