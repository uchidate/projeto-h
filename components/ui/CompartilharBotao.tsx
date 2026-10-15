'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Link2, Share2 } from 'lucide-react'
import { IconFacebook, IconWhatsApp } from '@/components/ui/SocialIcons'
import { trackShare, type RedeCompartilhamento } from '@/lib/analytics'
import { campanhaDoCaminho, comUtm } from '@/lib/utm'

interface Props {
    url: string
    title: string
    /** 'photo': sobre imagem escura fixa (hero com backdrop). */
    tone?: 'default' | 'photo'
    /** Alinhamento horizontal do menu; no celular o botão fica à direita da linha. */
    menuAlign?: 'start' | 'end'
    /** 'right' onde o ancestral corta o que sai por baixo (hero com `overflow-hidden`) e há espaço ao lado. */
    menuSide?: 'up' | 'down' | 'right'
    /** 'sm' (40 px) para linhas de metadados; 'md' (48 px) alinha com os botões de ação. */
    size?: 'sm' | 'md'
}

/**
 * Um único botão de compartilhar, no lugar de três ícones soltos.
 *
 * Medido em 2026-10 (Umami): 6 cliques de compartilhamento em ~4,7 mil sessões
 * desde 18/09 (WhatsApp 3, copiar link 2, Facebook 1). Três ícones no hero
 * competiam em peso com os botões de ação por quase nenhum uso. Aqui há um
 * botão só; onde existe a folha nativa (celular), ela abre e o WhatsApp vem
 * dentro dela. Sem folha nativa (desktop), um menu pequeno com as mesmas três
 * opções de antes.
 *
 * Cada rede continua levando o próprio utm_source (ver lib/utm.ts), e o clique
 * continua indo para `trackShare` com a mesma rede de antes.
 */
export function CompartilharBotao({ url, title, tone = 'default', menuAlign = 'start', menuSide = 'down', size = 'md' }: Props) {
    const tc = useTranslations('client')
    const [aberto, setAberto] = useState(false)
    const [copiado, setCopiado] = useState(false)
    const raiz = useRef<HTMLDivElement>(null)

    const campanha = campanhaDoCaminho(url)
    const linkPara = (source: string) => comUtm(url, { source, medium: 'share', campaign: campanha })
    const caminho = (() => { try { return new URL(url).pathname } catch { return url } })()
    const registrar = (rede: RedeCompartilhamento) => trackShare({ rede, caminho })

    useEffect(() => {
        if (!aberto) return
        const fora = (e: MouseEvent) => { if (!raiz.current?.contains(e.target as Node)) setAberto(false) }
        const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
        document.addEventListener('mousedown', fora)
        document.addEventListener('keydown', esc)
        return () => {
            document.removeEventListener('mousedown', fora)
            document.removeEventListener('keydown', esc)
        }
    }, [aberto])

    async function aoClicar() {
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            registrar('nativo')
            try { await navigator.share({ title, url: linkPara('nativo') }) } catch { /* cancelado pelo usuário */ }
            return
        }
        setAberto(v => !v)
    }

    async function copiar() {
        registrar('copiar_link')
        try {
            await navigator.clipboard.writeText(linkPara('copiar_link'))
            setCopiado(true)
            setTimeout(() => { setCopiado(false); setAberto(false) }, 1200)
        } catch { /* fallback silencioso */ }
    }

    const botao = tone === 'photo'
        ? 'border-white/40 bg-black/30 text-white backdrop-blur-xs hover:border-white hover:bg-black/50'
        : 'border-border text-muted hover:border-accent hover:text-accent'
    const item = 'flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-[14px] font-semibold text-foreground transition-colors hover:bg-background hover:text-accent'

    return (
        <div ref={raiz} className="relative">
            <button
                type="button"
                onClick={aoClicar}
                aria-haspopup="menu"
                aria-expanded={aberto}
                aria-label={tc('share.label')}
                title={tc('share.label')}
                className={`flex items-center justify-center border transition-colors ${size === 'sm' ? 'h-10 w-10' : 'h-12 w-12'} ${botao}`}
            >
                <Share2 size={18} />
            </button>
            {aberto && (
                <div role="menu" className={`absolute z-30 w-52 border border-border bg-surface shadow-xl ${menuSide === 'right' ? 'bottom-0 left-full ml-2' : `${menuSide === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} ${menuAlign === 'end' ? 'right-0' : 'left-0'}`}`}>
                    <a role="menuitem" className={item} target="_blank" rel="noopener noreferrer"
                        href={`https://wa.me/?text=${encodeURIComponent(`${title}\n${linkPara('whatsapp')}`)}`}
                        onClick={() => { registrar('whatsapp'); setAberto(false) }}>
                        <IconWhatsApp size={16} /> WhatsApp
                    </a>
                    <a role="menuitem" className={item} target="_blank" rel="noopener noreferrer"
                        href={`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(linkPara('facebook'))}`}
                        onClick={() => { registrar('facebook'); setAberto(false) }}>
                        <IconFacebook size={16} /> Facebook
                    </a>
                    <button role="menuitem" type="button" className={item} onClick={copiar}>
                        {copiado ? <Check size={16} className="text-green-500" /> : <Link2 size={16} />}
                        {copiado ? tc('share.copied') : tc('share.copy')}
                    </button>
                </div>
            )}
        </div>
    )
}
