'use client'
import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { trackNewsletterPedido } from '@/lib/analytics'

type Estado = 'carregando' | 'inativa' | 'pronto' | 'enviando' | 'enviado' | 'erro'

/**
 * Newsletter do rodapé. Só aparece quando o servidor diz que a newsletter está configurada
 * (GET /api/newsletter): a página é estática, então a decisão é feita no navegador.
 * Dupla confirmação: o envio manda um e-mail com link; o cadastro só vale ao clicar nele.
 */
export function NewsletterForm() {
    const [estado, setEstado] = useState<Estado>('carregando')
    const [email, setEmail] = useState('')
    const [mensagem, setMensagem] = useState('')

    useEffect(() => {
        let cancelado = false
        fetch('/api/newsletter').then(r => r.json()).then(d => { if (!cancelado) setEstado(d.ativa ? 'pronto' : 'inativa') }).catch(() => { if (!cancelado) setEstado('inativa') })
        return () => { cancelado = true }
    }, [])

    if (estado === 'carregando' || estado === 'inativa') return null

    async function enviar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const site = (new FormData(e.currentTarget).get('site') as string) ?? ''
        setEstado('enviando')
        try {
            const r = await fetch('/api/newsletter', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, site }) })
            if (r.ok) { setEstado('enviado'); trackNewsletterPedido(); return }
            setMensagem(r.status === 400 ? 'Confira o e-mail digitado.' : r.status === 429 ? 'Muitas tentativas. Tente de novo mais tarde.' : 'Não conseguimos enviar agora. Tente de novo em instantes.')
        } catch {
            setMensagem('Sem conexão. Tente de novo.')
        }
        setEstado('erro')
    }

    return (
        <section data-bloco="rodape-newsletter" aria-labelledby="newsletter-titulo" className="flex flex-col gap-3 border-b border-featured-border py-7 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <div className="lg:max-w-[46ch]">
                <h2 id="newsletter-titulo" className="text-[17px] font-black">Fã de K-pop e K-drama? Receba as novidades 💗</h2>
                <p className="mt-1 text-[13px] leading-5 text-featured-muted">Lançamentos, estreias e achados da loja no seu e-mail. Você confirma o endereço e sai quando quiser.</p>
            </div>
            {estado === 'enviado' ? (
                <p role="status" className="text-[14px] font-bold text-accent">Quase lá! Enviamos um e-mail para {email}: clique no link para confirmar.</p>
            ) : (
                <form onSubmit={enviar} className="w-full lg:max-w-[460px]" noValidate>
                    <div className="flex gap-2">
                        <label htmlFor="newsletter-email" className="sr-only">Seu e-mail</label>
                        <input id="newsletter-email" type="email" required autoComplete="email" inputMode="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)}
                            className="min-h-11 min-w-0 flex-1 border border-featured-border bg-transparent px-3 text-[14px] text-featured-fg placeholder:text-featured-muted focus:border-accent focus:outline-none" />
                        {/* Isca para robôs: fora da tela e fora da ordem de tabulação. */}
                        <input type="text" name="site" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
                        <button type="submit" disabled={estado === 'enviando'} className="min-h-11 shrink-0 bg-accent px-5 text-[14px] font-black text-white transition-[filter] hover:brightness-110 disabled:opacity-60">
                            {estado === 'enviando' ? 'Enviando…' : 'Quero receber'}
                        </button>
                    </div>
                    {estado === 'erro' && <p role="alert" className="mt-2 text-[12px] text-accent">{mensagem}</p>}
                    <p className="mt-2 text-[11px] text-featured-muted">Ao se inscrever, você concorda com a nossa <Link href="/privacidade" className="underline hover:text-accent">Política de Privacidade</Link>.</p>
                </form>
            )}
        </section>
    )
}
