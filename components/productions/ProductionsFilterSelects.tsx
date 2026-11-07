'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { WPTerm } from '@/lib/wordpress/types'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { queryAtual } from '@/lib/listagem/query-atual'
import { navegarListagem } from '@/lib/listagem/navegar'

interface Props {
    genres: WPTerm[]
    platforms: WPTerm[]
    currentGenre?: string
    currentPlatform?: string
}

export function ProductionsFilterSelects({ genres, platforms, currentGenre, currentPlatform }: Props) {
    const pathname = usePathname()
    const t = useTranslations('client.productionsLista')

    const navigate = (key: string, value: string) => {
        const params = queryAtual()
        if (value) { params.set(key, value) } else { params.delete(key) }
        params.delete('page')
        navegarListagem(`${pathname}${params.toString() ? `?${params}` : ''}`)
    }

    return (
        <>
            {genres.length > 0 && (
                <FilterSelect
                        label={t('genreLabel')}
                        value={currentGenre ?? ''}
                        onChange={e => navigate('genre', e.target.value)}
                        aria-label={t('genreAria')}
                    >
                        <option value="">{t('genreAll')}</option>
                        {genres.map(g => <option key={g.id} value={g.slug}>{g.name}</option>)}
                </FilterSelect>
            )}
            {platforms.length > 0 && (
                <FilterSelect
                        label={t('platformLabel')}
                        value={currentPlatform ?? ''}
                        onChange={e => navigate('platform', e.target.value)}
                        aria-label={t('platformAria')}
                    >
                        <option value="">{t('platformAll')}</option>
                        {platforms.map(p => <option key={p.id} value={p.slug}>{p.name}</option>)}
                </FilterSelect>
            )}
        </>
    )
}
