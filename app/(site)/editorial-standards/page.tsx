import type { Metadata } from 'next'
import { EditorialStandardsPage } from '@/components/institucional/EditorialStandardsPage'
import { metadataInstitucional } from '@/components/institucional/Texto'

export const generateMetadata = (): Promise<Metadata> => metadataInstitucional('editorialStandards', 'pt')

export default function Page() {
    return <EditorialStandardsPage locale="pt" />
}
