import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { AgencyAffiliation, WPAgency, WPArtist, WPGroup, WPProduction } from '@/lib/wordpress/types'

type PreviewOrganization = {
    slug?: string
    fields?: Partial<NonNullable<WPAgency['acf']>>
    relationships?: Array<{
        target_slug: string
        relation_type: string
        status: 'current' | 'former' | 'disputed' | 'announced'
        from_year?: number
        to_year?: number | null
        is_primary?: boolean
    }>
}

type AgencyPreviewManifest = {
    organizations?: PreviewOrganization[]
    groups?: Array<{
        slug?: string
        fields?: Partial<NonNullable<WPGroup['acf']>>
    }>
    artists?: Array<{
        slug?: string
        fields?: Partial<NonNullable<WPArtist['acf']>>
        content?: string
        productions?: WPProduction[]
    }>
    affiliations?: Array<{
        entity_type: 'artist' | 'group'
        entity_slug: string
        agency_slug: string
        relation_type: string
        status: 'current' | 'former' | 'disputed' | 'announced'
        from_year?: number
        to_year?: number | null
        is_primary?: boolean
    }>
}

export async function applyEntityAffiliationsManifestPreview<T extends WPArtist | WPGroup>(
    entities: T[],
    entityType: 'artist' | 'group',
    agencies: WPAgency[],
): Promise<T[]> {
    const manifestPath = process.env.AGENCY_PREVIEW_MANIFEST
    if (process.env.NODE_ENV === 'production' || !manifestPath) return entities
    try {
        const absolutePath = path.resolve(process.cwd(), manifestPath)
        const manifest = JSON.parse(await readFile(absolutePath, 'utf8')) as AgencyPreviewManifest
        const bySlug = new Map(agencies.map(agency => [agency.slug, agency]))
        const affiliationsBySlug = new Map<string, AgencyAffiliation[]>()
        for (const item of manifest.affiliations ?? []) {
            if (item.entity_type !== entityType) continue
            const agency = bySlug.get(item.agency_slug)
            if (!agency) continue
            const entries = affiliationsBySlug.get(item.entity_slug) ?? []
            entries.push({
                agency_id: agency.id, relation_type: item.relation_type, status: item.status,
                from_year: item.from_year, to_year: item.to_year, is_primary: item.is_primary,
            })
            affiliationsBySlug.set(item.entity_slug, entries)
        }
        return entities.map(entity => {
            const affiliations = affiliationsBySlug.get(entity.slug)
            if (!affiliations?.length) return entity
            const primary = affiliations.find(item => item.status === 'current' && item.is_primary)
            return { ...entity, acf: { ...entity.acf, agency: primary?.agency_id ?? entity.acf?.agency, agency_affiliations: affiliations } }
        })
    } catch (error) {
        console.warn(`Entity affiliation preview manifest unavailable: ${manifestPath}`, error)
        return entities
    }
}

export async function applyGroupManifestPreview(group: WPGroup, agencies: WPAgency[]): Promise<WPGroup> {
    const [withAffiliations] = await applyEntityAffiliationsManifestPreview([group], 'group', agencies)
    const manifestPath = process.env.AGENCY_PREVIEW_MANIFEST
    if (process.env.NODE_ENV === 'production' || !manifestPath) return withAffiliations
    try {
        const absolutePath = path.resolve(process.cwd(), manifestPath)
        const manifest = JSON.parse(await readFile(absolutePath, 'utf8')) as AgencyPreviewManifest
        const preview = manifest.groups?.find(item => item.slug === group.slug)
        if (!preview?.fields) return withAffiliations
        return { ...withAffiliations, acf: { ...withAffiliations.acf, ...preview.fields } }
    } catch (error) {
        console.warn(`Group preview manifest unavailable: ${manifestPath}`, error)
        return withAffiliations
    }
}

export async function applyArtistManifestPreview(artist: WPArtist): Promise<WPArtist> {
    const manifestPath = process.env.AGENCY_PREVIEW_MANIFEST
    if (process.env.NODE_ENV === 'production' || !manifestPath) return artist
    try {
        const absolutePath = path.resolve(process.cwd(), manifestPath)
        const manifest = JSON.parse(await readFile(absolutePath, 'utf8')) as AgencyPreviewManifest
        const preview = manifest.artists?.find(item => item.slug === artist.slug)
        if (!preview) return artist
        return {
            ...artist,
            acf: preview.fields ? { ...artist.acf, ...preview.fields } : artist.acf,
            content: preview.content ? { rendered: preview.content } : artist.content,
        }
    } catch (error) {
        console.warn(`Artist preview manifest unavailable: ${manifestPath}`, error)
        return artist
    }
}

/** Injeta produções sintéticas (ex: papel ainda não cadastrado como post `production` no WP) só em preview local. */
export async function applyArtistProductionsPreview(artistSlug: string, productions: WPProduction[]): Promise<WPProduction[]> {
    const manifestPath = process.env.AGENCY_PREVIEW_MANIFEST
    if (process.env.NODE_ENV === 'production' || !manifestPath) return productions
    try {
        const absolutePath = path.resolve(process.cwd(), manifestPath)
        const manifest = JSON.parse(await readFile(absolutePath, 'utf8')) as AgencyPreviewManifest
        const preview = manifest.artists?.find(item => item.slug === artistSlug)
        if (!preview?.productions?.length) return productions
        return [...preview.productions, ...productions]
    } catch (error) {
        console.warn(`Artist productions preview manifest unavailable: ${manifestPath}`, error)
        return productions
    }
}

export async function applyAgencyManifestPreview(agency: WPAgency): Promise<WPAgency> {
    const manifestPath = process.env.AGENCY_PREVIEW_MANIFEST
    if (process.env.NODE_ENV === 'production' || !manifestPath) return agency

    try {
        const absolutePath = path.resolve(process.cwd(), manifestPath)
        const manifest = JSON.parse(await readFile(absolutePath, 'utf8')) as AgencyPreviewManifest
        const organization = manifest.organizations?.find(item => item.slug === agency.slug)
        if (!organization?.fields) return agency

        return {
            ...agency,
            acf: {
                ...agency.acf,
                ...organization.fields,
            },
        }
    } catch (error) {
        console.warn(`Agency preview manifest unavailable: ${manifestPath}`, error)
        return agency
    }
}

export async function applyAgencyDirectoryManifestPreview(agencies: WPAgency[]): Promise<WPAgency[]> {
    const manifestPath = process.env.AGENCY_PREVIEW_MANIFEST
    if (process.env.NODE_ENV === 'production' || !manifestPath) return agencies

    try {
        const absolutePath = path.resolve(process.cwd(), manifestPath)
        const manifest = JSON.parse(await readFile(absolutePath, 'utf8')) as AgencyPreviewManifest
        const bySlug = new Map(agencies.map(agency => [agency.slug, agency]))
        const previewBySlug = new Map((manifest.organizations ?? []).map(item => [item.slug, item]))

        return agencies.map(agency => {
            const preview = previewBySlug.get(agency.slug)
            if (!preview) return agency
            const relationships = (preview.relationships ?? []).flatMap(relation => {
                const target = bySlug.get(relation.target_slug)
                return target ? [{
                    organization_id: target.id,
                    relation_type: relation.relation_type,
                    status: relation.status,
                    from_year: relation.from_year,
                    to_year: relation.to_year,
                    is_primary: relation.is_primary,
                }] : []
            })
            return {
                ...agency,
                acf: {
                    ...agency.acf,
                    ...preview.fields,
                    organization_relationships: relationships.length
                        ? relationships
                        : agency.acf?.organization_relationships,
                },
            }
        })
    } catch (error) {
        console.warn(`Agency directory preview manifest unavailable: ${manifestPath}`, error)
        return agencies
    }
}
