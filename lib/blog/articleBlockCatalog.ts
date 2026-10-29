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
const blocosDoPrefixo = catalogo.blocks.map((block) => ({ ...block, name: block.name.replace('__bloco__/', `${BLOCK_CSS_PREFIX}/`).replace('__bloco2__/', `${BLOCK_ALT_PREFIX}/`) }))

/**
 * Troca de prefixo em fases: todo bloco próprio também vale sob `hallyuhub/`, para que o conteúdo possa
 * migrar de nome sem que a página quebre (bloco fora do catálogo derruba a renderização). O nome antigo
 * sai na fase 4. Ver notas/decisoes/2026-10-29-renomear-prefixos-ondacoreana.md, no repositório de operação.
 */
const NOME_NOVO = 'hallyuhub'
const aliases = blocosDoPrefixo
    .filter((block) => /^(?!core\/)[a-z0-9-]+\//.test(block.name) && !block.name.startsWith(`${NOME_NOVO}/`))
    .filter((block) => block.name.startsWith(`${BLOCK_CSS_PREFIX}/`) || block.name.startsWith(`${BLOCK_ALT_PREFIX}/`))
    .map((block) => ({ ...block, name: `${NOME_NOVO}/${block.name.split('/')[1]}` }))
const nomesExistentes = new Set(blocosDoPrefixo.map((block) => block.name))

const catalog = {
    ...catalogo,
    blocks: [...blocosDoPrefixo, ...aliases.filter((block, i) => !nomesExistentes.has(block.name) && aliases.findIndex((outro) => outro.name === block.name) === i)],
}

export type ArticleBlockCatalogEntry = (typeof catalog.blocks)[number]

export const ARTICLE_BLOCK_CATALOG = catalog
export const ARTICLE_BLOCKS = new Map(catalog.blocks.map((block) => [block.name, block]))

export function isArticleBlockSupported(name: string) {
    return ARTICLE_BLOCKS.get(name)?.surfaces.includes('article') ?? false
}
