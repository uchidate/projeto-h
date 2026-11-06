// @vitest-environment node
import { execSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

// Exceções deliberadas: o idioma é do conteúdo de fora, não do visitante.
const PERMITIDOS = [
    'lib/i18n/', // config e format.ts são a fonte
    'components/i18n/AvisoSemTraducao.tsx', // hrefLang do original, que é sempre português
    'lib/tmdb/', // idioma pedido à API do TMDB
    'components/ui/StoreCard.tsx', // preço em BRL
]

describe('formatação por idioma', () => {
    it("'pt-BR' literal só aparece em lib/i18n e nas exceções documentadas", () => {
        const achados = execSync(
            "grep -rlE \"'pt-BR'|\\\"pt-BR\\\"\" components app lib --include='*.tsx' --include='*.ts' || true",
            { encoding: 'utf8' },
        ).split('\n').filter(Boolean)
            .filter((f) => !f.includes('.test.'))
            .filter((f) => !PERMITIDOS.some((p) => f.startsWith(p) || f === p))
        expect(achados).toEqual([])
    })
})
