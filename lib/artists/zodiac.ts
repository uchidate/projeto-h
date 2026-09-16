import { parseAcfDate } from '@/lib/utils'

export function getZodiac(dateStr: string): { sign: string; emoji: string } | null {
    try {
        // parseAcfDate constrói a data no fuso LOCAL de propósito (data editorial
        // sem horário não deve deslocar de dia); usar getUTCMonth/getUTCDate aqui
        // reintroduziria esse deslocamento em qualquer TZ com offset positivo
        // (ex: Asia/Tokyo), trocando o signo de quem nasceu num dia de virada.
        const d = parseAcfDate(dateStr)
        if (isNaN(d.getTime())) return null
        const m = d.getMonth() + 1
        const day = d.getDate()
        if ((m === 3 && day >= 21) || (m === 4 && day <= 19)) return { sign: 'Áries',        emoji: '♈' }
        if ((m === 4 && day >= 20) || (m === 5 && day <= 20)) return { sign: 'Touro',        emoji: '♉' }
        if ((m === 5 && day >= 21) || (m === 6 && day <= 20)) return { sign: 'Gêmeos',       emoji: '♊' }
        if ((m === 6 && day >= 21) || (m === 7 && day <= 22)) return { sign: 'Câncer',       emoji: '♋' }
        if ((m === 7 && day >= 23) || (m === 8 && day <= 22)) return { sign: 'Leão',         emoji: '♌' }
        if ((m === 8 && day >= 23) || (m === 9 && day <= 22)) return { sign: 'Virgem',       emoji: '♍' }
        if ((m === 9 && day >= 23) || (m === 10 && day <= 22)) return { sign: 'Libra',       emoji: '♎' }
        if ((m === 10 && day >= 23) || (m === 11 && day <= 21)) return { sign: 'Escorpião',  emoji: '♏' }
        if ((m === 11 && day >= 22) || (m === 12 && day <= 21)) return { sign: 'Sagitário',  emoji: '♐' }
        if ((m === 12 && day >= 22) || (m === 1 && day <= 19)) return { sign: 'Capricórnio', emoji: '♑' }
        if ((m === 1 && day >= 20) || (m === 2 && day <= 18)) return { sign: 'Aquário',      emoji: '♒' }
        return { sign: 'Peixes', emoji: '♓' }
    } catch { return null }
}
