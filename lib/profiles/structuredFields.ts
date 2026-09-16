export type ArtistAward = {
    year: string
    category: string
    title: string
    event: string
}

export type ArtistMilestone = {
    year: string
    description: string
}

export function parseArtistAwards(values: readonly string[] | undefined): ArtistAward[] {
    return (values ?? []).flatMap(raw => {
        const parts = raw.split('|').map(part => part.trim())
        if (parts.length < 2 || !parts[0] || !parts[1]) return []
        return [{
            year: parts[0],
            category: parts[1],
            title: parts[2] ?? '',
            event: parts[3] ?? '',
        }]
    })
}

export function parseArtistMilestones(values: readonly string[] | undefined): ArtistMilestone[] {
    return (values ?? []).flatMap(raw => {
        const separator = raw.indexOf('|')
        if (separator < 0) return []
        const year = raw.slice(0, separator).trim()
        const description = raw.slice(separator + 1).trim()
        if (!year || !description) return []
        return [{ year, description }]
    })
}
