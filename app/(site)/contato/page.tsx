import { CONTACT_EMAIL } from '@/lib/constants/identidade.mjs'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants/site'

export const metadata: Metadata = {
    title: 'Contato',
    alternates: { canonical: `${SITE_URL}/contato` },
}

export default function ContatoPage() {
    return (
        <>
        <div className="page-wrap py-12 max-w-xl">
            <h1 className="text-[36px] font-black mb-2 text-foreground">Contato</h1>
            <p className="text-[15px] text-muted mb-8">
                Sugestões, correções, parcerias ou solicitações de remoção de conteúdo?
                Envie uma mensagem:
            </p>
            <form
                action={`mailto:${CONTACT_EMAIL}`}
                method="GET"
                className="space-y-4"
            >
                <div>
                    <label className="block text-[13px] font-bold text-foreground mb-1.5" htmlFor="subject">
                        Assunto
                    </label>
                    <input
                        id="subject"
                        name="subject"
                        type="text"
                        required
                        placeholder="Ex: Correção de informação, Parceria..."
                        className="w-full h-10 px-3 border border-border bg-background text-[14px] text-foreground placeholder:text-muted focus:border-accent focus:outline-hidden transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-[13px] font-bold text-foreground mb-1.5" htmlFor="body">
                        Mensagem
                    </label>
                    <textarea
                        id="body"
                        name="body"
                        required
                        rows={5}
                        placeholder="Descreva sua dúvida ou sugestão..."
                        className="w-full px-3 py-2.5 border border-border bg-background text-[14px] text-foreground placeholder:text-muted focus:border-accent focus:outline-hidden transition-colors resize-none"
                    />
                </div>
                <button
                    type="submit"
                    className="h-10 px-6 bg-foreground text-background text-[14px] font-bold hover:opacity-90 transition-opacity"
                >
                    Enviar mensagem
                </button>
                <p className="text-[11px] text-muted">Abre seu cliente de e-mail padrão.</p>
            </form>
        </div>
        </>
    )
}
