export const TYPE_LABELS: Record<string, string> = {
    drama:   'Dorama',
    movie:   'Filme',
    special: 'Especial',
    variety: 'Variety Show',
}

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    airing:    { label: 'Em exibição', color: 'text-green-500 bg-green-500/10' },
    completed: { label: 'Concluído',   color: 'text-blue-500 bg-blue-500/10' },
    upcoming:  { label: 'Em breve',    color: 'text-gold bg-gold/10' },
}
