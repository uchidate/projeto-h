'use client'

import { useEffect, useRef } from 'react'
import { BreadcrumbTrail, type BreadcrumbItem } from '@/components/ui/BreadcrumbTrail'
import { BarraAncorada } from '@/components/ui/BarraAncorada'

interface Props {
    crumbs: BreadcrumbItem[]
    description?: string
}

export function PageBreadcrumb({ crumbs, description }: Props) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const update = () => {
            document.documentElement.style.setProperty('--breadcrumb-h', `${el.offsetHeight}px`)
        }
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => {
            ro.disconnect()
            document.documentElement.style.removeProperty('--breadcrumb-h')
        }
    }, [])

    return (
        <>
            <BarraAncorada abaixoDaFaixaDeSecao deslocamento={1} z={200} className="bg-background">
            <div
                ref={ref}
                className="mx-auto w-full max-w-[1440px] border-b border-border/40"
            >
                <div className="page-wrap py-2">
                    <nav aria-label="Breadcrumb">
                        <BreadcrumbTrail
                            items={crumbs}
                            className="mb-0.5 flex items-center gap-1.5 font-mono text-[10px] text-muted"
                            itemClassName="flex items-center gap-1.5"
                            linkClassName="transition-colors hover:text-foreground"
                            currentClassName="text-foreground"
                        />
                    </nav>
                    {description && (
                        <p className="font-mono text-[11px] text-muted">{description}</p>
                    )}
                </div>
            </div>
            </BarraAncorada>
            <div aria-hidden="true" className="h-(--breadcrumb-h,0px)" />
        </>
    )
}
