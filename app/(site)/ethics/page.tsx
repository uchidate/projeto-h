import type { Metadata } from 'next'
import { EthicsPage } from '@/components/institucional/EthicsPage'
import { metadataInstitucional } from '@/components/institucional/Texto'

export const generateMetadata = (): Promise<Metadata> => metadataInstitucional('ethics', 'pt')

export default function Page() {
    return <EthicsPage locale="pt" />
}
