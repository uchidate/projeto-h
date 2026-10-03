import { readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { MANIFESTO_DE_ROTAS } from './route-manifest'
import { caminhoPtDe } from './routes'

const RAIZ = process.cwd()

/** Todas as `page.tsx` de um grupo de rotas, como caminho público (`/a/[b]`). */
function paginasDe(grupo: string): string[] {
    const base = join(RAIZ, 'app', grupo)
    const achadas: string[] = []
    const percorrer = (dir: string, prefixo: string) => {
        for (const entrada of readdirSync(dir, { withFileTypes: true })) {
            if (entrada.isDirectory()) percorrer(join(dir, entrada.name), `${prefixo}/${entrada.name}`)
            else if (entrada.name === 'page.tsx') achadas.push(prefixo || '/')
        }
    }
    percorrer(base, '')
    return achadas.sort()
}

/** `filtrado` é destino interno de rewrite (listagens estáticas), não uma rota pública. */
const ehInterna = (caminho: string) => caminho.split('/').includes('filtrado')

/** Páginas de `app/(intl)/[locale]`, trazidas ao caminho em português via `ROUTES` (`/sign-in` → `/entrar`). */
const paginasEmIntl = () => {
    const dePara = caminhoPtDe('en')
    return paginasDe('(intl)/[locale]').map(c => dePara[c] ?? c)
}

const paginasPt = paginasDe('(site)').filter(c => !ehInterna(c))

describe('manifesto de rotas (i18n)', () => {
    it('toda página pública em português tem uma decisão de idioma', () => {
        const semDecisao = paginasPt.filter(c => !(c in MANIFESTO_DE_ROTAS))
        expect(semDecisao, `Rota nova sem entrada em lib/i18n/route-manifest.ts: ${semDecisao.join(', ')}`).toEqual([])
    })

    it('não há entrada do manifesto sem página correspondente', () => {
        const orfas = Object.keys(MANIFESTO_DE_ROTAS).filter(c => !paginasPt.includes(c))
        expect(orfas, `Entradas sem página em app/(site): ${orfas.join(', ')}`).toEqual([])
    })

    it('rota marcada como pronta existe em app/(intl)/[locale]', () => {
        const emIntl = paginasEmIntl()
        const prontas = Object.entries(MANIFESTO_DE_ROTAS).filter(([, r]) => r.estado === 'pronta').map(([c]) => c)
        const faltando = prontas.filter(c => !emIntl.includes(c))
        expect(faltando, `Marcadas como prontas, mas sem página em app/(intl): ${faltando.join(', ')}`).toEqual([])
    })

    it('toda página em app/(intl) está marcada como pronta (sem tradução fantasma)', () => {
        const emIntl = paginasEmIntl()
        const naoMarcadas = emIntl.filter(c => MANIFESTO_DE_ROTAS[c]?.estado !== 'pronta')
        expect(naoMarcadas, `Páginas em app/(intl) fora do manifesto como "pronta": ${naoMarcadas.join(', ')}`).toEqual([])
    })

    it('"somentePt" sempre traz o motivo', () => {
        for (const [caminho, rota] of Object.entries(MANIFESTO_DE_ROTAS)) {
            if (rota.estado === 'somentePt') expect(rota.motivo.trim(), caminho).not.toBe('')
        }
    })

    it('a pasta de páginas existe (guarda contra rodar fora da raiz)', () => {
        expect(existsSync(join(RAIZ, 'app', '(site)'))).toBe(true)
    })
})
