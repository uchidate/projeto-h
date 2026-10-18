'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ExternalLink, X } from 'lucide-react'
import type { StoreProduct } from '@/lib/wordpress/store'
import { calcularDesconto } from '@/lib/wordpress/store'
import { stripHtml } from '@/lib/utils'
import { trackProductClick } from '@/lib/analytics'

const CHAVE = 'hh_loja_deslizante_fechada'
const lerFechada = () => { try { return sessionStorage.getItem(CHAVE) === '1' } catch { return false } }

/**
 * Cartão que entra no canto inferior esquerdo depois de o leitor passar de ~45% da página.
 * Só no desktop (no celular o rodapé já tem o anúncio fixo e o banner de consentimento),
 * não cobre o texto, fecha no X e não volta na mesma sessão.
 */
export function LojaDeslizante({ product, bloco, contexto }: { product?: StoreProduct; bloco: string; contexto: string }) {
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
    return (
        <aside data-bloco={bloco} aria-label="Achado da loja"
            className="fixed bottom-6 left-6 z-40 w-[340px] animate-in slide-in-from-bottom-6 fade-in overflow-hidden rounded-xl border border-accent/50 bg-linear-to-b from-accent/15 to-surface shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6),0_0_28px_-8px_var(--color-accent)] duration-500">
            <button type="button" onClick={fechar} aria-label="Fechar" className="absolute right-2 top-2 z-10 rounded-full bg-background/85 p-1.5 text-muted hover:text-foreground">
                <X size={14} aria-hidden />
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer sponsored" className="group block"
                onClick={() => trackProductClick({ productId: product.id, store: acf.store ?? 'outro', contexto })}>
                <span className="relative block aspect-video overflow-hidden bg-background">
                    {acf.image_url && <Image src={acf.image_url} alt={nome} fill sizes="340px" className="object-cover transition-transform duration-300 group-hover:scale-105" />}
                    {desconto !== null && <span className="absolute left-0 top-3 bg-accent px-2.5 py-1 text-[12px] font-black text-white">-{desconto}%</span>}
                    <span className="absolute bottom-0 left-0 bg-background/85 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-accent">🛍️ Achado · afiliado</span>
                </span>
                <span className="block p-3">
                    <span className="line-clamp-2 block text-[14px] font-semibold leading-snug">{nome}</span>
                    <span className="mt-2 flex items-center justify-between gap-3">
                        <span className="flex items-baseline gap-2">
                            {acf.price && <span className="text-2xl font-black leading-none">{acf.price}</span>}
                            {acf.original_price && desconto !== null && <span className="text-[12px] text-muted line-through">{acf.original_price}</span>}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-accent px-3 py-2 text-[13px] font-black text-white transition-[filter] group-hover:brightness-110">
                            Ver oferta <ExternalLink size={13} aria-hidden />
                        </span>
                    </span>
                </span>
            </a>
        </aside>
    )
}
