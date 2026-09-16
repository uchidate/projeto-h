import { describe, it, expect } from 'vitest'
import { getZodiac } from './zodiac'

describe('getZodiac', () => {
    it('retorna null pra uma data inválida', () => {
        expect(getZodiac('not-a-date')).toBeNull()
    })

    it.each([
        ['20000321', 'Áries'],
        ['20000419', 'Áries'],
        ['20000420', 'Touro'],
        ['20000520', 'Touro'],
        ['20000521', 'Gêmeos'],
        ['20000620', 'Gêmeos'],
        ['20000621', 'Câncer'],
        ['20000722', 'Câncer'],
        ['20000723', 'Leão'],
        ['20000822', 'Leão'],
        ['20000823', 'Virgem'],
        ['20000922', 'Virgem'],
        ['20000923', 'Libra'],
        ['20001022', 'Libra'],
        ['20001023', 'Escorpião'],
        ['20001121', 'Escorpião'],
        ['20001122', 'Sagitário'],
        ['20001221', 'Sagitário'],
        ['20001222', 'Capricórnio'],
        ['20000119', 'Capricórnio'],
        ['20000120', 'Aquário'],
        ['20000218', 'Aquário'],
        ['20000219', 'Peixes'],
        ['20000320', 'Peixes'],
    ])('%s → %s (fronteiras exatas de cada signo)', (dateStr, expectedSign) => {
        expect(getZodiac(dateStr)?.sign).toBe(expectedSign)
    })

    it('aceita datas no formato YYYY-MM-DD além do formato ACF YYYYMMDD', () => {
        expect(getZodiac('2000-03-21')?.sign).toBe('Áries')
    })

    it('retorna o emoji correspondente ao signo', () => {
        expect(getZodiac('20000321')).toEqual({ sign: 'Áries', emoji: '♈' })
    })

    // Regressão: getZodiac usava getUTCMonth/getUTCDate sobre uma data construída
    // deliberadamente no fuso LOCAL (parseAcfDate) — num fuso com offset positivo
    // (ex: Asia/Tokyo, UTC+9), meia-noite local vira o dia ANTERIOR em UTC,
    // trocando o signo de quem nasceu num dia de virada de signo. Corrigido em
    // 2026-07-06 pra usar getMonth/getDate (local), consistente com o parseAcfDate.
    it('não desloca o signo em fusos com offset positivo (ex: Asia/Tokyo)', () => {
        const original = process.env.TZ
        process.env.TZ = 'Asia/Tokyo'
        try {
            expect(getZodiac('20000321')?.sign).toBe('Áries')
        } finally {
            process.env.TZ = original
        }
    })

    it('não desloca o signo em fusos com offset negativo (ex: America/Sao_Paulo)', () => {
        const original = process.env.TZ
        process.env.TZ = 'America/Sao_Paulo'
        try {
            expect(getZodiac('20000321')?.sign).toBe('Áries')
        } finally {
            process.env.TZ = original
        }
    })
})
