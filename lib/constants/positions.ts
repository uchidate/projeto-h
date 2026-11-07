/** Mantido em sincronia com oc_valid_positions() em plugin de CPTs do WordPress. O rótulo de cada
 *  posição mora em messages (client.positionsPage.labels), por idioma. */
export const POSITIONS = [
    'leader', 'main_vocal', 'lead_vocal', 'sub_vocal', 'main_dancer', 'lead_dancer',
    'main_rapper', 'sub_rapper', 'visual', 'center', 'maknae',
] as const

export const VALID_POSITIONS: string[] = [...POSITIONS]

export function isValidPosition(value: string): boolean {
    return VALID_POSITIONS.includes(value)
}
