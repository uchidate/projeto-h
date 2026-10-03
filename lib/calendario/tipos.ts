export type CalendarEvent = {
    id: number
    day: number
    month: number
    year: number
    date: string // YYYY-MM-DD (ano do evento, pode ser próximo ano)
    daysUntil: number // 0 = hoje, negativo = passado (neste mês)
    type: 'birthday' | 'debut'
    name: string
    slug: string
    href: string
    image: { src: string; alt: string } | null
    extra?: string
}
