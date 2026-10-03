import type { Metadata } from 'next'
import { CorrectionsPage } from '@/components/institucional/CorrectionsPage'
import { metadataInstitucional } from '@/components/institucional/Texto'

export const generateMetadata = (): Promise<Metadata> => metadataInstitucional('corrections', 'pt')

export default function Page() {
    return <CorrectionsPage locale="pt" />
}
