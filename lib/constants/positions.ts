/** Mantido em sincronia com oc_valid_positions() e oc_position_labels() em plugin de CPTs do WordPress */
export const POSITION_LABELS: Record<string, string> = {
    leader: 'Líder',
    main_vocal: 'Main Vocal',
    lead_vocal: 'Lead Vocal',
    sub_vocal: 'Sub-Vocal',
    main_dancer: 'Main Dancer',
    lead_dancer: 'Lead Dancer',
    main_rapper: 'Main Rapper',
    sub_rapper: 'Sub-Rapper',
    visual: 'Visual',
    center: 'Center',
    maknae: 'Maknae',
}

export const VALID_POSITIONS = Object.keys(POSITION_LABELS)

export function isValidPosition(value: string): boolean {
    return VALID_POSITIONS.includes(value)
}
