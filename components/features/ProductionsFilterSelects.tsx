'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { WPTerm } from '@/lib/wordpress/types'
import { FilterSelect } from '@/components/ui/FilterSelect'

interface Props {
    genres: WPTerm[]
    platforms: WPTerm[]
    currentGenre?: string
    currentPlatform?: string
}

export function ProductionsFilterSelects({ genres, platforms, currentGenre, currentPlatform }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const navigate = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) { params.set(key, value) } else { params.delete(key) }
        params.delete('page')
        router.push(`${pathname}${params.toString() ? `?${params}` : ''}`)
    }

    return (
        <>
            {genres.length > 0 && (
                <FilterSelect
                        label="Gênero"
                        value={currentGenre ?? ''}
                        onChange={e => navigate('genre', e.target.value)}
                        aria-label="Filtrar por gênero"
                    >
                        <option value="">Todos</option>
                        {genres.map(g => <option key={g.id} value={g.slug}>{g.name}</option>)}
                </FilterSelect>
            )}
            {platforms.length > 0 && (
                <FilterSelect
                        label="Plataforma"
                        value={currentPlatform ?? ''}
                        onChange={e => navigate('platform', e.target.value)}
                        aria-label="Filtrar por plataforma"
                    >
                        <option value="">Todas</option>
                        {platforms.map(p => <option key={p.id} value={p.slug}>{p.name}</option>)}
                </FilterSelect>
            )}
        </>
    )
}
