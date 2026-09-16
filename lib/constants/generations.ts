export const GENERATIONS = [
    { slug: '1', label: '1ª geração', shortLabel: '1ª gen.', min: 1990, max: 2002, className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300' },
    { slug: '2', label: '2ª geração', shortLabel: '2ª gen.', min: 2003, max: 2011, className: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300' },
    { slug: '3', label: '3ª geração', shortLabel: '3ª gen.', min: 2012, max: 2017, className: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300' },
    { slug: '4', label: '4ª geração', shortLabel: '4ª gen.', min: 2018, max: 2022, className: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300' },
    { slug: '5', label: '5ª geração', shortLabel: '5ª gen.', min: 2023, max: 9999, className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
] as const

export type Generation = typeof GENERATIONS[number]

export function getGeneration(year: number | string | null | undefined): Generation | null {
    const parsedYear = typeof year === 'number' ? year : Number(year)
    if (!Number.isFinite(parsedYear)) return null
    return GENERATIONS.find(generation => parsedYear >= generation.min && parsedYear <= generation.max) ?? null
}

export function getGenerationBySlug(slug: string | undefined): Generation | undefined {
    return GENERATIONS.find(g => g.slug === slug)
}
