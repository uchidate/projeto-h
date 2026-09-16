import type { ElementType, ReactNode } from 'react'
import { BrandDot } from '@/components/ui/BrandDot'

type BlockHeaderProps = {
    title: ReactNode
    eyebrow?: ReactNode
    action?: ReactNode
    icon?: ReactNode
    meta?: ReactNode
    headingLevel?: 2 | 3
    size?: 'sm' | 'md' | 'lg'
    tone?: 'accent' | 'muted'
    brandDot?: boolean
    className?: string
}

// Display serifado, no registro specimen: o título de seção era sans font-black,
// que é voz de dashboard. O serifado em corpo maior e peso médio dá ao perfil a
// energia de peça impressa — e o contraste com o mono dos eyebrows fica legível
// em vez de ser dois pesos da mesma família brigando.
const TITLE_SIZE = {
    sm: 'text-[1.1875rem] leading-[1.2]',
    md: 'text-[1.5rem] leading-[1.12] lg:text-[1.75rem]',
    lg: 'text-[1.75rem] leading-[1.04] lg:text-[2.5rem]',
} as const

export function BlockHeader({
    title,
    eyebrow,
    action,
    icon: _icon,
    meta,
    headingLevel = 2,
    size = 'md',
    tone = 'accent',
    brandDot = false,
    className = '',
}: BlockHeaderProps) {
    const Heading = `h${headingLevel}` as ElementType

    return (
        <header className={`mb-6 flex items-start justify-between gap-3 border-b border-border/80 pb-4 sm:items-end sm:gap-4 ${className}`}>
            {/* Sem caixa de ícone: 32px + 12px de gap empurravam o título 44px para
                dentro, então as seções com ícone desalinhavam das demais. A caixa
                com borda também é vocabulário de painel, não de impresso — o
                rótulo mono já identifica a seção. */}
            <div className="flex min-w-0 items-center">
                <div className="min-w-0">
                    {eyebrow && (
                        <p className={`font-mono text-[10px] font-black uppercase leading-4 tracking-[0.16em] ${tone === 'accent' ? 'text-accent' : 'text-muted'}`}>
                            {eyebrow}
                        </p>
                    )}
                    <Heading className={`mt-2 max-w-[22ch] font-serif font-medium tracking-[-0.02em] text-foreground sm:max-w-none ${TITLE_SIZE[size]}`}>
                        {title}{brandDot && <BrandDot />}
                    </Heading>
                </div>
            </div>
            {(action || meta) && <div className="shrink-0">{action ?? meta}</div>}
        </header>
    )
}
