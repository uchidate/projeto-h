import type { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class GroupPage extends BasePage {
    constructor(page: Page, private readonly slug: string) {
        super(page)
    }

    async open() {
        return this.goto(`/groups/${this.slug}`)
    }

    async getMusicGroupSchema() {
        const groups = await this.getJsonLdByType('MusicGroup')
        return groups[0]
    }
}
