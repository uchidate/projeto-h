import type { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class AgencyPage extends BasePage {
    constructor(page: Page, private readonly slug: string) {
        super(page)
    }

    async open() {
        return this.goto(`/agencies/${this.slug}`)
    }

    async getOrganizationSchema() {
        const orgs = await this.getJsonLdByType('Organization')
        return orgs[0]
    }
}
