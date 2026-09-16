'use client'
import { SITE_NAME } from '@/lib/constants/site'

import { ExternalLink, Star } from 'lucide-react'
import { trackPreferredSourceClick } from '@/lib/analytics'
import { GOOGLE_PREFERRED_SOURCE_URL } from '@/lib/constants/site'

interface Props {
    postSlug: string
}

export function GooglePreferredSource({ postSlug }: Props) {
    return (
        <aside
            className="not-prose my-7 overflow-hidden rounded-md border border-border bg-surface"
            aria-labelledby="google-preferred-source-title"
        >
            <div className="flex items-stretch">
                <div
                    className="flex w-14 shrink-0 items-center justify-center bg-[#4285f4] text-white sm:w-16"
                    aria-hidden="true"
                >
                    <Star className="h-5 w-5" fill="currentColor" />
                </div>

                <div className="min-w-0 flex-1 px-4 py-3.5 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:px-5">
                    <div>
                        <p className="mb-1 font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">
                            Suas fontes no Google
                        </p>
                        <p id="google-preferred-source-title" className="text-[14px] font-black leading-snug text-foreground sm:text-[15px]">
                            Adicione o {SITE_NAME} às suas fontes preferidas
                        </p>
                    </div>

                    <a
                        href={GOOGLE_PREFERRED_SOURCE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackPreferredSourceClick(postSlug)}
                        className="mt-3 inline-flex shrink-0 items-center gap-1.5 rounded-xs bg-foreground px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.08em] text-background transition-colors hover:bg-accent-a11y hover:text-white sm:mt-0"
                        aria-label={`Escolher o ${SITE_NAME} como fonte preferida no Google (abre em uma nova aba)`}
                    >
                        Escolher no Google
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                </div>
            </div>
        </aside>
    )
}
