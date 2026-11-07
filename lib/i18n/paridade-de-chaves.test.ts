// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from './config'

const RAIZ = join(__dirname, '../../messages')

function folhas(valor: unknown, prefixo = '', saida: string[] = []): string[] {
    if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
        for (const [k, v] of Object.entries(valor)) folhas(v, prefixo ? `${prefixo}.${k}` : k, saida)
    } else saida.push(prefixo)
    return saida
}

const ler = (locale: string, arquivo: string) => JSON.parse(readFileSync(join(RAIZ, locale, arquivo), 'utf8'))

describe('paridade de chaves entre idiomas ativos', () => {
    const arquivos = readdirSync(join(RAIZ, DEFAULT_LOCALE)).filter(a => a.endsWith('.json'))

    for (const locale of ACTIVE_LOCALES.filter(l => l !== DEFAULT_LOCALE)) {
        it.each(arquivos)(`${locale}/%s tem as mesmas chaves do português`, arquivo => {
            const pt = new Set(folhas(ler(DEFAULT_LOCALE, arquivo)))
            const outro = new Set(folhas(ler(locale, arquivo)))
            expect([...pt].filter(k => !outro.has(k)), 'faltam no idioma').toEqual([])
            expect([...outro].filter(k => !pt.has(k)), 'sobram no idioma').toEqual([])
        })
    }
})
