import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// O provedor de mensagens do cliente (components/layout/SiteShell.tsx) só entrega `messages.client`.
// Componente 'use client' que pede outro namespace quebra o build com MISSING_MESSAGE
// (aconteceu com `profile.ui` em GroupErasTimeline), e testes sem provedor não percebem.
const RAIZ = process.cwd()

function arquivos(dir: string, saida: string[] = []): string[] {
    for (const nome of readdirSync(dir)) {
        if (nome === 'node_modules' || nome.startsWith('.')) continue
        const caminho = join(dir, nome)
        if (statSync(caminho).isDirectory()) arquivos(caminho, saida)
        else if (caminho.endsWith('.tsx') && !caminho.endsWith('.test.tsx')) saida.push(caminho)
    }
    return saida
}

const ehCliente = (fonte: string) => /^\s*(\/\*[\s\S]*?\*\/\s*|\/\/[^\n]*\n\s*)*['"]use client['"]/.test(fonte)

describe('namespaces de useTranslations em componentes de cliente', () => {
    const clientes = [...arquivos(join(RAIZ, 'components')), ...arquivos(join(RAIZ, 'app'))]
        .map(caminho => ({ caminho, fonte: readFileSync(caminho, 'utf8') }))
        .filter(({ fonte }) => ehCliente(fonte))

    it('encontra componentes de cliente (sanidade do detector)', () => {
        expect(clientes.length).toBeGreaterThan(20)
    })

    it('todo useTranslations(...) usa o namespace client ou client.*', () => {
        const erros: string[] = []
        for (const { caminho, fonte } of clientes) {
            for (const m of fonte.matchAll(/useTranslations\(\s*['"]([^'"]+)['"]/g)) {
                const ns = m[1]
                if (ns !== 'client' && !ns.startsWith('client.')) erros.push(`${caminho.replace(RAIZ + '/', '')}: useTranslations('${ns}')`)
            }
        }
        expect(erros, `use 'client.*' em componentes de cliente:\n${erros.join('\n')}`).toEqual([])
    })
})
