import type { Metadata } from 'next'
import { metadataDoLayout } from '@/lib/i18n/metadata-layout'
import { SiteShell } from '@/components/layout/SiteShell'

export const metadata: Metadata = metadataDoLayout('pt')

export default function SiteLayout({ children }: { children: React.ReactNode }) {
    return <SiteShell locale="pt">{children}</SiteShell>
}
