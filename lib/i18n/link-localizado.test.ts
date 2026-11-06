// @vitest-environment node
import { execSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

describe('links internos', () => {
    it('componentes e páginas usam LocalizedLink, não next/link', () => {
        const achados = execSync(
            "grep -rln \"from 'next/link'\" components app --include='*.tsx' --include='*.ts' || true",
            { encoding: 'utf8' },
        ).split('\n').filter(Boolean).filter((f) => !f.endsWith('components/i18n/LocalizedLink.tsx'))
        expect(achados).toEqual([])
    })
})
