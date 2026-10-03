'use client'

import { useRouter, usePathname } from 'next/navigation'
import type { WPTerm } from '@/lib/wordpress/types'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { queryAtual } from '@/lib/listagem/query-atual'

interface Props {
    categories: WPTerm[]
    current?: string
}

export function BlogCategorySelect({ categories, current }: Props) {
    const router = useRouter()
    const pathname = usePathname()

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const params = queryAtual()
        if (e.target.value) {
            params.set('category', e.target.value)
        } else {
            params.delete('category')
        }
        params.delete('page')
        router.push(`${pathname}${params.toString() ? `?${params}` : ''}`)
    }

    return (
        <FilterSelect
                label="Categoria"
                value={current ?? ''}
                onChange={handleChange}
                aria-label="Filtrar por categoria"
            >
                <option value="">Todas</option>
                {categories.filter(c => c.slug !== 'uncategorized').map(c => (
                    <option key={c.id} value={c.slug}>{c.name} ({c.count})</option>
                ))}
        </FilterSelect>
    )
}
