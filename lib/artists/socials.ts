import { getSocialUrl } from '@/lib/utils'

export type SocialEntry = {
    key: string
    url: string
    label: string
    color: string
}

export function buildSocialEntries(acf: Record<string, unknown>): SocialEntry[] {
    const entries: SocialEntry[] = []
    const ig = getSocialUrl(acf.instagram as string, 'instagram')
    const xUrl = getSocialUrl(acf.twitter as string, 'x')
    const yt = getSocialUrl(acf.youtube as string, 'youtube')
    const tt = getSocialUrl(acf.tiktok as string, 'tiktok')
    const sp = getSocialUrl(acf.spotify as string, 'spotify')
    if (ig)   entries.push({ key: 'instagram', url: ig,   label: 'Instagram',   color: 'text-pink-400' })
    if (xUrl) entries.push({ key: 'x',         url: xUrl, label: 'X / Twitter', color: 'text-sky-400' })
    if (yt)   entries.push({ key: 'youtube',   url: yt,   label: 'YouTube',     color: 'text-red-400' })
    if (tt)   entries.push({ key: 'tiktok',    url: tt,   label: 'TikTok',      color: 'text-foreground' })
    if (sp)   entries.push({ key: 'spotify',   url: sp,   label: 'Spotify',     color: 'text-green-500' })
    return entries
}
