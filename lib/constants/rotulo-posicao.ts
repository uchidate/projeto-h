import { traduzirChave } from '@/lib/i18n/chave-dinamica'
import { isValidPosition } from './positions'

/**
 * Rótulo da posição no idioma de `t` (namespace `client.positionsPage`). Posição desconhecida
 * (o WordPress pode ter valores novos) volta como veio.
 */
export function rotuloDaPosicao(t: unknown, position: string): string {
    return isValidPosition(position) ? traduzirChave(t, `labels.${position}`) : position
}
