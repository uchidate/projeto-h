import type { Metadata } from 'next'
import { SITE_NAME, SITE_URL } from '@/lib/constants/site'
import { ConsentPreferences } from '@/components/consent/ConsentPreferences'

export const metadata: Metadata = {
    title: 'Política de Privacidade',
    alternates: { canonical: `${SITE_URL}/privacidade` },
}

export default function PrivacidadePage() {
    const updated = '11 de outubro de 2026'
    return (
        <>
        <div className="page-wrap py-12 max-w-2xl">
            <h1 className="text-[36px] font-black mb-2 text-foreground">Política de Privacidade</h1>
            <p className="text-[13px] text-muted mb-8">Última atualização: {updated}</p>
            <div className="space-y-6 text-[15px] text-foreground leading-relaxed">
                <section>
                    <h2 className="text-[18px] font-bold mb-2">1. Dados coletados</h2>
                    <p className="text-muted">Este site coleta dados de navegação (páginas visitadas, tempo de permanência) via Google Analytics para melhorar a experiência do usuário. Enquanto você não aceitar os cookies, essa medição roda sem armazenar identificadores no seu navegador. Não coletamos dados pessoais identificáveis sem consentimento explícito.</p>
                    <p className="text-muted mt-3">Com o seu aceite, usamos também o Microsoft Clarity, uma ferramenta de análise de uso que registra como o site é navegado — cliques, rolagem e movimentos do cursor — em formato de gravação da sessão e de mapa de calor. O objetivo é encontrar páginas confusas ou com defeito. O conteúdo de campos de formulário é mascarado, e a ferramenta não é usada nas páginas de entrar e cadastrar. O Clarity é operado pela Microsoft, que trata esses dados conforme a própria <a href="https://privacy.microsoft.com/privacystatement" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">política de privacidade</a>.</p>
                </section>
                <section>
                    <h2 className="text-[18px] font-bold mb-2">2. Cookies</h2>
                    <p className="text-muted">Cookies essenciais — preferência de tema (claro/escuro), sessão de navegação e segurança — são sempre usados, porque sem eles o site não funciona. Cookies de medição de audiência e de anúncios personalizados só são gravados depois que você aceita. Sem esse aceite, os anúncios continuam aparecendo, porém não personalizados.</p>
                    <p className="text-muted mt-3">O Microsoft Clarity grava os cookies <code>_clck</code> e <code>_clsk</code>, para reconhecer a mesma visita entre páginas e agrupar a sessão. Eles só são gravados depois que você aceita e deixam de ser usados se você recusar ou retirar o consentimento pelos controles da seção 4.</p>
                </section>
                <section>
                    <h2 className="text-[18px] font-bold mb-2">3. Anúncios</h2>
                    <p className="text-muted">O {SITE_NAME} exibe anúncios através do Google AdSense. Com o seu aceite, o Google pode usar cookies para exibir anúncios relevantes com base em visitas anteriores a este e a outros sites. Saiba mais em <a href="https://policies.google.com/technologies/ads" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">políticas de anúncios do Google</a>. Visitantes do Espaço Econômico Europeu e do Reino Unido respondem ao aviso de consentimento do próprio Google, que também permite rever a escolha a qualquer momento.</p>
                </section>
                <section>
                    <h2 className="text-[18px] font-bold mb-2">4. Suas preferências de cookies</h2>
                    <ConsentPreferences />
                </section>
                <section>
                    <h2 className="text-[18px] font-bold mb-2">5. Seus direitos (LGPD)</h2>
                    <p className="text-muted">Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito de solicitar acesso, correção ou exclusão dos seus dados, e de retirar o consentimento a qualquer momento pelos controles acima. Entre em contato pelo nosso <a href="/contato" className="text-accent hover:underline">formulário</a>.</p>
                </section>
            </div>
        </div>
        </>
    )
}
