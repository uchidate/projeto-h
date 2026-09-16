import type { Page } from '@playwright/test'
import { BasePage } from './BasePage'

type ListingKind = 'productions' | 'artists' | 'groups' | 'agencies' | 'comidas' | 'empresas' | 'blog' | 'guias'

export class ListingPage extends BasePage {
    constructor(page: Page, private readonly kind: ListingKind) {
        super(page)
    }

    async open(query = '') {
        return this.goto(`/${this.kind}${query}`)
    }
}
