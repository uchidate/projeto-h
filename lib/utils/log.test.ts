import { describe, expect, it } from 'vitest'
import { paraLog } from './log'

describe('paraLog', () => {
    it('impede forja de log: quebra de linha não cria evento novo', () => {
        const forjado = '1.2.3.4\n[revalidate] ok — tags=[tudo]'
        expect(paraLog(forjado)).not.toContain('\n')
    })

    it('neutraliza diretiva de formatação do console', () => {
        // Sem isto, `%s` consumiria o próximo argumento da chamada ao console.
        expect(paraLog('%s%d%o')).toBe('%%s%%d%%o')
    })

    it('remove caracteres de controle, não só \\n e \\r', () => {
        expect(paraLog('a\u0000b\u001bc\u007fd')).toBe('a b c d')
    })

    it('corta o tamanho', () => {
        expect(paraLog('x'.repeat(500))).toHaveLength(120)
        expect(paraLog('x'.repeat(500), 10)).toHaveLength(10)
    })

    it('valor ausente vira travessão em vez de "undefined"', () => {
        expect(paraLog(undefined)).toBe('—')
        expect(paraLog(null)).toBe('—')
    })

    it('mantém texto comum legível', () => {
        expect(paraLog('artist/dowoon')).toBe('artist/dowoon')
    })
})
