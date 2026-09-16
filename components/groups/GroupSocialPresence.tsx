import { useTranslations } from 'next-intl'
import { Globe, ExternalLink } from 'lucide-react'
import { IconInstagram, IconX, IconYoutube, IconTikTok, IconSpotify } from '@/components/ui/SocialIcons'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'

interface Entry { key: string; href: string; label: string }

const PLATFORM_META: Record<string, {
    Icon: React.ElementType
    color: string
    bg: string
    border: string
    textOnBg: string
}> = {
    instagram: { Icon: IconInstagram, color: '#E1306C', bg: 'rgba(225,48,108,0.08)', border: 'rgba(225,48,108,0.25)', textOnBg: '#E1306C' },
    twitter:   { Icon: IconX,         color: '#1a8cd8', bg: 'rgba(29,161,242,0.08)', border: 'rgba(29,161,242,0.2)',  textOnBg: '#1a8cd8' },
    youtube:   { Icon: IconYoutube,   color: '#FF0000', bg: 'rgba(255,0,0,0.08)',    border: 'rgba(255,0,0,0.2)',    textOnBg: '#FF0000' },
    spotify:   { Icon: IconSpotify,   color: '#1DB954', bg: 'rgba(29,185,84,0.08)', border: 'rgba(29,185,84,0.2)',  textOnBg: '#1DB954' },
    tiktok:    { Icon: IconTikTok,    color: '#ffffff', bg: 'rgba(0,0,0,0.85)',      border: 'rgba(255,255,255,0.1)', textOnBg: '#00f2ea' },
    website:   { Icon: Globe,         color: '#7a808d', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)', textOnBg: '#7a808d' },
}

function extractHandle(href: string): string | null {
    try {
        const url = new URL(href)
        const parts = url.pathname.replace(/^\/|\/$/g, '').split('/')
        const last = parts[parts.length - 1]
        if (!last || last.length < 2) return null
        return `@${last.replace(/^@+/, '')}`
    } catch { return null }
}

interface Props {
    entries: Entry[]
    accent: string
    groupName: string
}

export function GroupSocialPresence({ entries, accent: _accent, groupName }: Props) {
    const t = useTranslations('profile.ui')
    if (entries.length === 0) return null

    return (
        <>
            <SectionTitleBar
                eyebrow={t('socialEyebrow')}
                title={t('socialTitle')}
                action={
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                        {entries.length} plataforma{entries.length !== 1 ? 's' : ''}
                    </span>
                }
            />

            <div className="grid gap-2 sm:grid-cols-2">
                {entries.map(entry => {
                    const meta = PLATFORM_META[entry.key] ?? PLATFORM_META.website
                    const { Icon } = meta
                    const handle = extractHandle(entry.href)
                    return (
                        <a key={entry.key} href={entry.href} target="_blank" rel="noopener noreferrer"
                            className="group flex items-center gap-3 border p-4 transition-all duration-150 hover:border-foreground/30"
                            style={{ borderColor: meta.border }}>
                            {/* Icon */}
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center border"
                                style={{ color: meta.color, borderColor: meta.border, background: entry.key === 'tiktok' ? '#000' : meta.bg }}>
                                <Icon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="mb-0.5 font-mono text-[10px] font-black uppercase leading-4 tracking-widest"
                                    style={{ color: meta.textOnBg }}>
                                    {entry.label}
                                </p>
                                <p className="font-bold text-[14px] text-foreground leading-tight truncate">
                                    {handle ?? groupName}
                                </p>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted opacity-50 group-hover:opacity-100 transition-opacity" />
                        </a>
                    )
                })}
            </div>
        </>
    )
}
