import type { Page } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * Page Object genérico pra páginas de detalhe que só têm BreadcrumbList (sem
 * schema de entidade próprio): comidas, empresas, blog. Evita 3 classes quase
 * idênticas — se uma dessas ganhar um schema próprio no futuro, promova pra
 * uma classe dedicada (ver AgencyPage/ArtistPage como exemplo).
 */
export class GenericDetailPage extends BasePage {
    constructor(page: Page, private readonly pathPrefix: string, private readonly slug: string) {
        super(page)
    }

    async open() {
        return this.goto(`/${this.pathPrefix}/${this.slug}`)
    }
}
