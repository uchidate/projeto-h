import type { Metadata } from 'next'
import { ContactPage } from '@/components/institucional/ContactPage'
import { metadataInstitucional } from '@/components/institucional/Texto'

export const generateMetadata = (): Promise<Metadata> => metadataInstitucional('contact', 'pt')

export default function Page() {
    return <ContactPage locale="pt" />
}
