import { afterEach, describe, expect, it, vi } from 'vitest'
import type { WPAgency, WPGroup } from '@/lib/wordpress/types'

const baseAgency = {
    id: 1,
    slug: 'hybe',
    acf: { founded_year: 2021, organization_kind: 'agency' },
} as WPAgency

describe('applyAgencyManifestPreview', () => {
    afterEach(() => {
        vi.resetModules()
        vi.unstubAllEnvs()
    })

    it('não altera dados sem manifesto configurado', async () => {
        delete process.env.AGENCY_PREVIEW_MANIFEST
        const { applyAgencyManifestPreview } = await import('./preview')
        await expect(applyAgencyManifestPreview(baseAgency)).resolves.toBe(baseAgency)
    })

    it('mescla os campos do manifesto somente no preview local', async () => {
        vi.stubEnv('NODE_ENV', 'development')
        vi.stubEnv('AGENCY_PREVIEW_MANIFEST', 'lib/agencies/__fixtures__/agency-network-hybe.json')
        const { applyAgencyManifestPreview } = await import('./preview')
        const result = await applyAgencyManifestPreview(baseAgency)

        expect(result.acf?.organization_kind).toBe('conglomerate')
        expect(result.acf?.founded_year).toBe(2005)
        expect(result.acf?.business_pillars).toHaveLength(3)
        expect(result.acf?.story_chapters).toHaveLength(5)
        expect(result.acf?.key_metrics).toHaveLength(6)
        expect(result.acf?.current_developments).toHaveLength(4)
        expect(result.acf?.featured_videos).toHaveLength(4)
    })

    it('resolve relações do manifesto por slug sem IDs hardcoded', async () => {
        vi.stubEnv('NODE_ENV', 'development')
        vi.stubEnv('AGENCY_PREVIEW_MANIFEST', 'lib/agencies/__fixtures__/agency-network-hybe.json')
        const { applyAgencyDirectoryManifestPreview } = await import('./preview')
        const label = { ...baseAgency, id: 2, slug: 'bighit-music', acf: {} } as WPAgency
        const result = await applyAgencyDirectoryManifestPreview([baseAgency, label])

        expect(result[1].acf?.organization_relationships).toContainEqual(expect.objectContaining({
            organization_id: 1,
            relation_type: 'label_of',
            status: 'current',
        }))
    })

    it('aplica afiliações em lote para alimentar contagens por organização', async () => {
        vi.stubEnv('NODE_ENV', 'development')
        vi.stubEnv('AGENCY_PREVIEW_MANIFEST', 'lib/agencies/__fixtures__/agency-network-hybe.json')
        const { applyEntityAffiliationsManifestPreview } = await import('./preview')
        const label = { ...baseAgency, id: 2, slug: 'bighit-music', acf: {} } as WPAgency
        const group = { id: 10, slug: 'bts', acf: { agency: 1 } } as WPGroup
        const [result] = await applyEntityAffiliationsManifestPreview([group], 'group', [baseAgency, label])

        expect(result.acf?.agency).toBe(2)
        expect(result.acf?.agency_affiliations).toContainEqual(expect.objectContaining({ agency_id: 2, is_primary: true }))
    })
})
