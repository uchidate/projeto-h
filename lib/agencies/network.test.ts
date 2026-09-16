import { describe, expect, it } from 'vitest'
import type { WPAgency, WPGroup } from '@/lib/wordpress/types'
import { entityBelongsToOrganizations, resolveAgencyNetwork, resolveEntityOrganizationContext } from './network'

function agency(id: number, relations: NonNullable<WPAgency['acf']>['organization_relationships'] = []): WPAgency {
    return { id, slug: `a-${id}`, status: 'publish', date: '', modified: '', title: { rendered: `A ${id}` }, content: { rendered: '', protected: false }, excerpt: { rendered: '', protected: false }, featured_media: 0, acf: { organization_relationships: relations } }
}

describe('resolveAgencyNetwork', () => {
    it('agrega descendentes ativos em vários níveis', () => {
        const root = agency(1)
        const label = agency(2, [{ organization_id: 1, relation_type: 'label_of', status: 'current' }])
        const division = agency(3, [{ organization_id: 2, relation_type: 'division_of', status: 'current' }])
        const network = resolveAgencyNetwork(root, [root, label, division])
        expect(network.organizationIds).toEqual([1, 2, 3])
        expect(network.ancestors).toEqual([])
    })

    it('expõe a controladora sem agregar labels irmãs ao catálogo', () => {
        const conglomerate = agency(1)
        const source = agency(2, [{ organization_id: 1, relation_type: 'label_of', status: 'current' }])
        const pledis = agency(3, [{ organization_id: 1, relation_type: 'label_of', status: 'current' }])
        const network = resolveAgencyNetwork(source, [conglomerate, source, pledis])

        expect(network.organizationIds).toEqual([2])
        expect(network.ancestors.map(item => item.id)).toEqual([1])
    })

    it('ignora relações encerradas', () => {
        const root = agency(1)
        const former = agency(2, [{ organization_id: 1, relation_type: 'subsidiary_of', status: 'former' }])
        expect(resolveAgencyNetwork(root, [root, former]).organizationIds).toEqual([1])
    })

    it('não entra em loop quando o CMS contém um ciclo', () => {
        const root = agency(1, [{ organization_id: 2, relation_type: 'joint_venture_with', status: 'current' }])
        const partner = agency(2, [{ organization_id: 1, relation_type: 'joint_venture_with', status: 'current' }])
        expect(resolveAgencyNetwork(root, [root, partner]).organizationIds.sort()).toEqual([1, 2])
    })

    it('resolve a cadeia grupo → label → conglomerado sem conhecer slugs', () => {
        const conglomerate = agency(1)
        const label = agency(2, [{ organization_id: 1, relation_type: 'label_of', status: 'current' }])
        const group = { acf: { agency_affiliations: [{ agency_id: 2, relation_type: 'managed_by', status: 'current', is_primary: true }] } } as WPGroup
        const context = resolveEntityOrganizationContext(group, [conglomerate, label])

        expect(context.nodes.map(node => [node.organization.id, node.depth])).toEqual([[2, 0], [1, 1]])
    })

    it('não recorre à agência legada quando o vínculo estruturado não é atual', () => {
        const formerAgency = agency(2)
        const group = { acf: { agency: 2, agency_affiliations: [{ agency_id: 2, relation_type: 'managed_by', status: 'former', is_primary: false }] } } as WPGroup

        expect(resolveEntityOrganizationContext(group, [formerAgency]).nodes).toEqual([])
        expect(entityBelongsToOrganizations(group, [2])).toBe(false)
    })
})
