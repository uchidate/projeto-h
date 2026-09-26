import { useTranslations } from 'next-intl'
import type { WPArtist, WPGroup, WPAgency } from '@/lib/wordpress/types'
import { stripHtml } from '@/lib/utils'
import { ArtistCard } from '@/components/artists/ArtistCard'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'

interface Props {
    artists: WPArtist[]
    label: string
    connectionGroup?: WPGroup
    agency?: WPAgency
    artistName: string
}

export function ArtistRelatedArtists({ artists, label, connectionGroup, agency, artistName: _artistName }: Props) {
    const t = useTranslations('profile.ui')
    if (!artists.length) return null
    const heading = connectionGroup
        ? t('next.alsoIn', { name: stripHtml(connectionGroup.title.rendered) })
        : agency ? t('next.sameRoster', { name: stripHtml(agency.title.rendered) }) : t('next.nextNames')

    return (
        <>
            <SectionTitleBar eyebrow={label} title={heading} className="mb-6 profile-measure" />
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 sm:gap-6 profile-measure">
                {artists.map(rel => (
                    <ArtistCard key={rel.id} artist={rel}
                        aspectRatio="aspect-square"
                        sizes="(max-width: 640px) 33vw, 20vw" />
                ))}
            </div>
        </>
    )
}
