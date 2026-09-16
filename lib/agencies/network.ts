import type { WPAgency, WPArtist, WPGroup } from '@/lib/wordpress/types'

const AGGREGATED_RELATIONS = new Set([
    'subsidiary_of',
    'label_of',
    'joint_venture_with',
    'division_of',
])

export type AgencyNetwork = {
    root: WPAgency
    organizations: WPAgency[]
    ancestors: WPAgency[]
    organizationIds: number[]
    byParent: Map<number, WPAgency[]>
}

export type EntityOrganizationNode = {
    organization: WPAgency
    depth: number
    direct: boolean
}

export type EntityOrganizationContext = {
    nodes: EntityOrganizationNode[]
    directOrganizations: WPAgency[]
}

export function entityBelongsToOrganizations(entity: WPArtist | WPGroup, organizationIds: number[]) {
    const ids = new Set(organizationIds)
    const affiliations = entity.acf?.agency_affiliations ?? []
    if (affiliations.length > 0) {
        return affiliations.some(item => item.status === 'current' && ids.has(item.agency_id))
    }
    return Boolean(entity.acf?.agency && ids.has(entity.acf.agency))
}
/**
 * Resolve o ecossistema ativo sem assumir uma árvore perfeita. Suporta vários
 * controladores, joint ventures e ciclos acidentais; relações encerradas não
 * contaminam o elenco atual do conglomerado.
 */
export function resolveAgencyNetwork(root: WPAgency, agencies: WPAgency[]): AgencyNetwork {
    const byId = new Map(agencies.map(agency => [agency.id, agency]))
    byId.set(root.id, root)

    const byParent = new Map<number, WPAgency[]>()
    for (const agency of byId.values()) {
        for (const relation of agency.acf?.organization_relationships ?? []) {
            if (relation.status !== 'current' || !AGGREGATED_RELATIONS.has(relation.relation_type)) continue
            const children = byParent.get(relation.organization_id) ?? []
            if (!children.some(child => child.id === agency.id)) children.push(agency)
            byParent.set(relation.organization_id, children)
        }
    }

    const visited = new Set<number>()
    const queue = [root.id]
    while (queue.length) {
        const id = queue.shift()!
        if (visited.has(id)) continue
        visited.add(id)
        for (const child of byParent.get(id) ?? []) {
            if (!visited.has(child.id)) queue.push(child.id)
        }
    }

    const organizations = [...visited]
        .map(id => byId.get(id))
        .filter((agency): agency is WPAgency => Boolean(agency))

    const ancestorIds = new Set<number>()
    const ancestorQueue = [root]
    while (ancestorQueue.length) {
        const organization = ancestorQueue.shift()!
        for (const relation of organization.acf?.organization_relationships ?? []) {
            if (relation.status !== 'current' || !AGGREGATED_RELATIONS.has(relation.relation_type)) continue
            if (relation.organization_id === root.id || ancestorIds.has(relation.organization_id)) continue
            const parent = byId.get(relation.organization_id)
            if (!parent) continue
            ancestorIds.add(parent.id)
            ancestorQueue.push(parent)
        }
    }
    const ancestors = [...ancestorIds].map(id => byId.get(id)).filter((agency): agency is WPAgency => Boolean(agency))
    return { root, organizations, ancestors, organizationIds: organizations.map(agency => agency.id), byParent }
}

export function resolveEntityOrganizationContext(entity: WPArtist | WPGroup, agencies: WPAgency[]): EntityOrganizationContext {
    const byId = new Map(agencies.map(agency => [agency.id, agency]))
    const affiliations = entity.acf?.agency_affiliations ?? []
    const currentAffiliations = affiliations.filter(item => item.status === 'current')
    const directIds = affiliations.length > 0
        ? currentAffiliations
            .sort((a, b) => Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)))
            .map(item => item.agency_id)
        : entity.acf?.agency ? [entity.acf.agency] : []
    const directOrganizations = [...new Set(directIds)].map(id => byId.get(id)).filter((item): item is WPAgency => Boolean(item))

    const depths = new Map<number, number>()
    const queue = directOrganizations.map(organization => ({ organization, depth: 0 }))
    while (queue.length) {
        const { organization, depth } = queue.shift()!
        const previousDepth = depths.get(organization.id)
        if (previousDepth !== undefined && previousDepth <= depth) continue
        depths.set(organization.id, depth)
        for (const relation of organization.acf?.organization_relationships ?? []) {
            if (relation.status !== 'current' || !AGGREGATED_RELATIONS.has(relation.relation_type)) continue
            const parent = byId.get(relation.organization_id)
            if (parent) queue.push({ organization: parent, depth: depth + 1 })
        }
    }

    const nodes = [...depths.entries()]
        .map(([id, depth]) => ({ organization: byId.get(id)!, depth, direct: depth === 0 }))
        .sort((a, b) => a.depth - b.depth || a.organization.title.rendered.localeCompare(b.organization.title.rendered))
    return { nodes, directOrganizations }
}
