import { getMusicReleases } from '@/lib/wordpress/music'
import { GroupDiscography, type DiscographyAlbum } from './GroupDiscography'

interface Props {
    groupId: number
    spotifyUrl?: string | null
    accent: string
}

export async function GroupDiscographyLoader({ groupId, spotifyUrl, accent }: Props) {
    const releases = await getMusicReleases({ groupId })
    if (!releases.length) return null

    const albums: DiscographyAlbum[] = releases.map(r => ({
        id: String(r.id),
        title: r.title,
        type: r.release_type === 'album' ? 'ALBUM'
            : r.release_type === 'ep' ? 'EP'
            : r.release_type === 'compilation' ? 'COMPILATION'
            : 'SINGLE',
        releaseYear: r.release_date ? parseInt(r.release_date.slice(0, 4)) : null,
        coverUrl: r.cover_url,
        spotifyUrl: r.spotify_url ?? spotifyUrl ?? '',
        tracks: [],
    }))

    return <GroupDiscography albums={albums} accent={accent} />
}
