import type { Page } from '@playwright/test'

/** Camada de suporte (Utility Layer) — helpers genéricos reusados por todos os Page Objects. */
export class BasePage {
    constructor(protected readonly page: Page) {}

    async goto(path: string) {
        // 'domcontentloaded' em vez do default 'load' — a home tem ~450KB de
        // HTML e várias imagens/fontes; esperar TODO recurso carregar (inclusive
        // imagens abaixo da dobra) não é necessário pra checar status/JSON-LD,
        // e deixava o smoke test lento e sujeito a timeout em runners mais
        // distantes/lentos (GitHub Actions hosted, ao contrário do ambiente local).
        return this.page.goto(path, { waitUntil: 'domcontentloaded' })
    }

    async getCanonical(): Promise<string | null> {
        return this.page.locator('link[rel="canonical"]').getAttribute('href')
    }

    async getJsonLdBlocks(): Promise<Record<string, unknown>[]> {
        const scripts = await this.page.locator('script[type="application/ld+json"]').allTextContents()
        return scripts.map(s => JSON.parse(s))
    }

    async getJsonLdByType(type: string): Promise<Record<string, unknown>[]> {
        const blocks = await this.getJsonLdBlocks()
        return blocks.filter(b => b['@type'] === type)
    }

    async getBreadcrumbSchemas(): Promise<Record<string, unknown>[]> {
        return this.getJsonLdByType('BreadcrumbList')
    }

    /** Verdadeiro se qualquer valor (em qualquer profundidade) for `null` literal. */
    static containsLiteralNull(value: unknown): boolean {
        if (value === null) return true
        if (Array.isArray(value)) return value.some(BasePage.containsLiteralNull)
        if (typeof value === 'object') return Object.values(value as object).some(BasePage.containsLiteralNull)
        return false
    }
}
