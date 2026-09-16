import type { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class ProductionPage extends BasePage {
    constructor(page: Page, private readonly slug: string) {
        super(page)
    }

    async open() {
        return this.goto(`/productions/${this.slug}`)
    }

    async getMovieOrSeriesSchema() {
        const blocks = await this.getJsonLdBlocks()
        return blocks.find(b => b['@type'] === 'Movie' || b['@type'] === 'TVSeries')
    }
}
