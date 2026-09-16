import { getSocialUrl } from '@/lib/utils'
import { IconInstagram, IconX, IconYoutube, IconTikTok, IconSpotify } from '@/components/ui/SocialIcons'

export type SocialEntry = {
    key: string
    url: string
    label: string
    color: string
    Icon: React.ElementType | null
}

export function buildSocialEntries(acf: Record<string, unknown>): SocialEntry[] {
    const entries: SocialEntry[] = []
    const ig = getSocialUrl(acf.instagram as string, 'instagram')
    const xUrl = getSocialUrl(acf.twitter as string, 'x')
    const yt = getSocialUrl(acf.youtube as string, 'youtube')
    const tt = getSocialUrl(acf.tiktok as string, 'tiktok')
    const sp = getSocialUrl(acf.spotify as string, 'spotify')
    if (ig)   entries.push({ key: 'instagram', url: ig,   label: 'Instagram',   color: 'text-pink-400',   Icon: IconInstagram })
    if (xUrl) entries.push({ key: 'x',         url: xUrl, label: 'X / Twitter', color: 'text-sky-400',    Icon: IconX })
    if (yt)   entries.push({ key: 'youtube',   url: yt,   label: 'YouTube',     color: 'text-red-400',    Icon: IconYoutube })
    if (tt)   entries.push({ key: 'tiktok',    url: tt,   label: 'TikTok',      color: 'text-foreground', Icon: IconTikTok })
    if (sp)   entries.push({ key: 'spotify',   url: sp,   label: 'Spotify',     color: 'text-green-500',  Icon: IconSpotify })
    return entries
}
