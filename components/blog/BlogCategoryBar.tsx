import Link from 'next/link'
import type { WPTerm } from '@/lib/wordpress/types'
import { ResponsiveFilterBar } from '@/components/ui/ResponsiveFilterBar'

type Props = {
    categories: WPTerm[]
    current?: string
}

export function BlogCategoryBar({ categories, current }: Props) {
    const visibleCategories = categories.filter(category => category.slug !== 'uncategorized')
    if (visibleCategories.length === 0) return null

    const chip = (active: boolean) =>
        `inline-flex h-8 shrink-0 items-center rounded-md px-3 text-[12px] font-bold transition-colors ${
            active ? 'bg-foreground text-background' : 'text-muted hover:bg-surface hover:text-foreground'
        }`

    const activeCategory = visibleCategories.find(c => c.slug === current)

    return (
        <ResponsiveFilterBar label="Filtros" value={activeCategory?.name ?? 'Blog'}>
            <div className="flex flex-wrap items-center gap-1 rounded-md bg-surface p-1">
                <Link href="/blog" className={chip(!current)}>Todos</Link>
                {visibleCategories.map(category => (
                    <Link
                        key={category.id}
                        href={`/blog?category=${category.slug}`}
                        className={chip(current === category.slug)}
                        aria-current={current === category.slug ? 'page' : undefined}
                    >
                        {category.name}
                        {category.count > 0 && (
                            <span className="ml-1 font-mono text-[9px] font-normal opacity-80">
                                {category.count}
                            </span>
                        )}
                    </Link>
                ))}
            </div>
        </ResponsiveFilterBar>
    )
}
