'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ExternalLink, X } from 'lucide-react'
import type { StoreProduct } from '@/lib/wordpress/store'
import { calcularDesconto } from '@/lib/wordpress/store'
import { stripHtml } from '@/lib/utils'
import { trackProductClick } from '@/lib/analytics'

const LOJAS: Record<string, string> = { shopee: 'Shopee', amazon: 'Amazon', mercadolivre: 'Mercado Livre', magalu: 'Magalu', shein: 'Shein' }
const CHAVE = 'hh_loja_deslizante_fechada'
const lerFechada = () => { try { return sessionStorage.getItem(CHAVE) === '1' } catch { return false } }

/**
 * Cartão que entra no canto inferior esquerdo depois de o leitor passar de ~45% da página.
 * Só no desktop (no celular o rodapé já tem o anúncio fixo e o banner de consentimento),
 * não cobre o texto, fecha no X e não volta na mesma sessão.
 */
export function LojaDeslizante({ product, bloco, contexto, mensagem = 'Gostou do que viu? Separei um achado pra fã 💗' }: { product?: StoreProduct; bloco: string; contexto: string; mensagem?: string }) {
    const [visivel, setVisivel] = useState(false)

    useEffect(() => {
        if (!product?.acf.affiliate_url || lerFechada()) return
        if (!window.matchMedia?.('(min-width: 1280px)').matches) return
        const aoRolar = () => {
            const alvo = document.documentElement.scrollHeight - window.innerHeight
            if (alvo > 0 && window.scrollY / alvo > 0.45) { setVisivel(true); window.removeEventListener('scroll', aoRolar) }
        }
        window.addEventListener('scroll', aoRolar, { passive: true })
        return () => window.removeEventListener('scroll', aoRolar)
    }, [product])

    const url = product?.acf.affiliate_url
    if (!visivel || !product || !url) return null
    const { acf } = product
    const nome = stripHtml(product.title.rendered)
    const fechar = () => { try { sessionStorage.setItem(CHAVE, '1') } catch { /* sem storage */ } setVisivel(false) }
    const desconto = calcularDesconto(acf.price, acf.original_price)
    const loja = LOJAS[acf.store ?? ''] ?? 'Loja parceira'
    return (
        <aside data-bloco={bloco} aria-label="Achado da loja"
            className="fixed bottom-6 left-6 z-40 w-[340px] animate-in slide-in-from-bottom-6 overflow-hidden rounded-2xl border-2 border-accent bg-surface opacity-100 shadow-[0_24px_60px_-10px_rgba(0,0,0,0.9)] duration-300">
            <span aria-hidden className="block h-1 bg-accent" />
            <button type="button" onClick={fechar} aria-label="Fechar" className="absolute right-2.5 top-3.5 z-10 rounded-full bg-surface p-1.5 text-foreground shadow ring-1 ring-border hover:text-foreground">
                <X size={14} aria-hidden />
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer sponsored" className="group block"
                onClick={() => trackProductClick({ productId: product.id, store: acf.store ?? 'outro', contexto })}>
                <span className="relative block aspect-video overflow-hidden bg-surface">
                    {acf.image_url && <Image src={acf.image_url} alt={nome} fill sizes="340px" className="object-cover transition-transform duration-300 group-hover:scale-105" />}
                    {desconto !== null && <span className="absolute left-3 top-3 rounded bg-accent px-2 py-1 text-[12px] font-black text-white shadow">-{desconto}%</span>}
                </span>
                <span className="block p-4">
                    <span className="flex items-center justify-between gap-2 font-mono text-[10px] font-black uppercase tracking-[0.14em]">
                        <span className="whitespace-nowrap text-accent">Achado da loja</span>
                        <span className="whitespace-nowrap text-foreground-subtle">{loja}</span>
                    </span>
                    <span className="mt-2 block text-[17px] font-black leading-snug">{mensagem}</span>
                    <span className="mt-1.5 line-clamp-2 block text-[13px] leading-snug text-muted">{nome}</span>
                    <span className="mt-3 flex items-baseline gap-2">
                        {acf.price && <span className="text-[26px] font-black leading-none">{acf.price}</span>}
                        {acf.original_price && desconto !== null && <span className="text-[13px] text-muted line-through">{acf.original_price}</span>}
                    </span>
                    <span className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-[14px] font-black text-white transition-[filter] group-hover:brightness-110">
                        Ver oferta <ExternalLink size={14} aria-hidden />
                    </span>
                    <span className="mt-2 block text-center text-[10px] text-foreground-subtle">Link de afiliado: o HallyuHub pode receber comissão.</span>
                </span>
            </a>
        </aside>
    )
}
