import { ExternalLink, Globe, Music } from 'lucide-react'
import { ShareBar } from '@/components/ui/ShareBar'
import { AnniversaryCountdown } from '@/components/ui/AnniversaryCountdown'
import { EntityActionBar } from '@/components/ui/EntityActionBar'

interface GroupActionsAcf {
    website?: string
    spotify?: string
    debut_date?: string
}

interface Props {
    groupUrl: string
    name: string
    acf: GroupActionsAcf
    disbandYear: number | null
}

export function GroupActions({ groupUrl, name, acf, disbandYear }: Props) {
    return (
        <div className="border-b border-border/50">
            <EntityActionBar className="page-wrap py-3">
                <ShareBar url={groupUrl} title={name} />
                {acf.website && (
                    <a href={acf.website} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 font-mono text-[11px] font-bold text-muted hover:border-foreground hover:text-foreground transition-colors">
                        <Globe size={12} /> Site oficial <ExternalLink size={10} />
                    </a>
                )}
                {acf.spotify && (
                    <a href={acf.spotify} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 border border-green-500/30 bg-green-500/10 px-3 py-1.5 font-mono text-[11px] font-bold text-green-400 hover:bg-green-500/20 transition-colors">
                        <Music size={12} /> Spotify
                    </a>
                )}
                {acf.debut_date && !disbandYear && (
                    <div className="ml-auto">
                        <AnniversaryCountdown debutDate={acf.debut_date} groupName={name} />
                    </div>
                )}
            </EntityActionBar>
        </div>
    )
}
