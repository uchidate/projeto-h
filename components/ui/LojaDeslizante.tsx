'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import type { StoreProduct } from '@/lib/wordpress/store'
import { stripHtml } from '@/lib/utils'
import { trackProductClick } from '@/lib/analytics'

const CHAVE = 'hh_loja_deslizante_fechada'
const lerFechada = () => { try { return sessionStorage.getItem(CHAVE) === '1' } catch { return false } }

/**
 * Cartão que entra no canto inferior esquerdo depois de o leitor passar de ~55% da página.
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
            if (alvo > 0 && window.scrollY / alvo > 0.55) { setVisivel(true); window.removeEventListener('scroll', aoRolar) }
        }
        window.addEventListener('scroll', aoRolar, { passive: true })
        return () => window.removeEventListener('scroll', aoRolar)
    }, [product])

    const url = product?.acf.affiliate_url
    if (!visivel || !product || !url) return null
    const { acf } = product
    const nome = stripHtml(product.title.rendered)
    const fechar = () => { try { sessionStorage.setItem(CHAVE, '1') } catch { /* sem storage */ } setVisivel(false) }
    return (
        <aside data-bloco={bloco} aria-label="Achado da loja"
            className="fixed bottom-6 left-6 z-40 w-[300px] animate-in slide-in-from-bottom-4 fade-in rounded-xl border border-border bg-surface shadow-xl duration-300">
            <button type="button" onClick={fechar} aria-label="Fechar" className="absolute right-1.5 top-1.5 z-10 rounded-full bg-background/80 p-1.5 text-muted hover:text-foreground">
                <X size={14} aria-hidden />
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer sponsored" className="flex gap-3 p-3"
                onClick={() => trackProductClick({ productId: product.id, store: acf.store ?? 'outro', contexto })}>
                <span className="relative h-20 w-20 shrink-0 overflow-hidden bg-background">
                    {acf.image_url && <Image src={acf.image_url} alt={nome} fill sizes="80px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1 pr-4">
                    <span className="block font-mono text-[10px] font-black uppercase tracking-[0.14em] text-accent">🛍️ Achado · afiliado</span>
                    <span className="mt-1 line-clamp-2 block text-[13px] font-semibold leading-snug">{nome}</span>
                    {acf.price && <span className="mt-1 block text-[15px] font-black">{acf.price}</span>}
                </span>
            </a>
        </aside>
    )
}
