import type { Metadata } from 'next'
import { AboutPage } from '@/components/institucional/AboutPage'
import { metadataInstitucional } from '@/components/institucional/Texto'

export const generateMetadata = (): Promise<Metadata> => metadataInstitucional('about', 'pt')

export default function Page() {
    return <AboutPage locale="pt" />
}
