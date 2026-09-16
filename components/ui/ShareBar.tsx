'use client'

import { useTranslations } from 'next-intl'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'
import { IconFacebook, IconWhatsApp } from '@/components/ui/SocialIcons'
import { trackShare, type RedeCompartilhamento } from '@/lib/analytics'
import { campanhaDoCaminho, comUtm } from '@/lib/utm'

interface Props {
    url: string
    title: string
    horizontal?: boolean
    showLabel?: boolean
}

export function ShareBar({ url, title, horizontal = true, showLabel = true }: Props) {
    const tc = useTranslations('client')
    const [copied, setCopied] = useState(false)

    // Cada rede leva o PRÓPRIO utm_source. Sem isso, a volta de um link
    // repassado no WhatsApp chega como tráfego direto, e o conteúdo que mais
    // viraliza é justamente o que o relatório não enxerga. Ver lib/utm.ts.
    const campanha = campanhaDoCaminho(url)
    const linkPara = (source: string) => comUtm(url, { source, medium: 'share', campaign: campanha })
    const caminho = (() => { try { return new URL(url).pathname } catch { return url } })()
    const registrar = (rede: RedeCompartilhamento) => trackShare({ rede, caminho })

    const shares: Array<{ label: string; rede: RedeCompartilhamento; icon: React.ReactNode; href: string }> = [
        {
            label: 'WhatsApp',
            rede: 'whatsapp',
            icon: <IconWhatsApp size={16} />,
            href: `https://wa.me/?text=${encodeURIComponent(`${title}\n${linkPara('whatsapp')}`)}`,
        },
        {
            label: 'Facebook',
            rede: 'facebook',
            icon: <IconFacebook size={16} />,
            href: `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(linkPara('facebook'))}`,
        },
    ]

    async function copyLink() {
        registrar('copiar_link')
        try {
            await navigator.clipboard.writeText(linkPara('copiar_link'))
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch { /* fallback silencioso */ }
    }

    const wrapperClass = horizontal ? 'flex items-center gap-2' : 'flex flex-col items-center gap-2'
    const btnClass = 'touch-target flex min-w-(--tap-target-min) items-center justify-center border border-border text-muted transition-colors hover:border-accent hover:text-accent'

    return (
        <div className={wrapperClass} aria-label={tc('share.label')}>
            {!horizontal && (
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                    {tc('share.label')}
                </span>
            )}
            {shares.map(s => (
                <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={btnClass}
                    aria-label={tc('share.on', { network: s.label })}
                    onClick={() => registrar(s.rede)}
                >
                    {s.icon}
                </a>
            ))}
            <button
                type="button"
                onClick={copyLink}
                className={`${btnClass} ${copied ? 'border-green-500 text-green-500' : ''}`}
                aria-label={tc('share.copy')}
            >
                {copied ? <Check size={14} /> : <Link2 size={16} />}
            </button>
            {horizontal && showLabel && (
                <span className="text-[11px] text-muted ml-1">
                    {copied ? tc('share.copied') : tc('share.label')}
                </span>
            )}
        </div>
    )
}
