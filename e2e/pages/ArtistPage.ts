import type { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class ArtistPage extends BasePage {
    constructor(page: Page, private readonly slug: string) {
        super(page)
    }

    async open() {
        return this.goto(`/artists/${this.slug}`)
    }

    async getPersonSchema() {
        const persons = await this.getJsonLdByType('Person')
        return persons[0]
    }
}
