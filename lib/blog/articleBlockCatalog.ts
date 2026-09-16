import catalogo from './article-block-catalog.json'
import { BLOCK_ALT_PREFIX, BLOCK_CSS_PREFIX } from '@/lib/constants/identidade.mjs'

/**
 * Catalogo de blocos do editor. Os blocos proprios tem o namespace do plugin
 * (`<prefixo>/alert`), gravado no HTML dos posts; no arquivo ele aparece como
 * `__bloco__` e e trocado aqui pelo prefixo configurado.
 *
 * O plugin do WordPress le a propria copia deste contrato, no repositorio de
 * operacao: mudanca de bloco precisa ser feita nos dois.
 */
const catalog = {
    ...catalogo,
    blocks: catalogo.blocks.map((block) => ({ ...block, name: block.name.replace('__bloco__/', `${BLOCK_CSS_PREFIX}/`).replace('__bloco2__/', `${BLOCK_ALT_PREFIX}/`) })),
}

export type ArticleBlockCatalogEntry = (typeof catalog.blocks)[number]

export const ARTICLE_BLOCK_CATALOG = catalog
export const ARTICLE_BLOCKS = new Map(catalog.blocks.map((block) => [block.name, block]))

export function isArticleBlockSupported(name: string) {
    return ARTICLE_BLOCKS.get(name)?.surfaces.includes('article') ?? false
}
