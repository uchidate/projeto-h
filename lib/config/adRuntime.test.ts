import { describe, expect, it } from 'vitest'
import { parseAdSenseStatus } from './adRuntime'

describe('parseAdSenseStatus', () => {
    it.each([
        ['filled', 'filled'],
        ['unfilled', 'unfilled'],
        ['unfill-optimized', 'unfilled'],
        [null, null],
        ['pending', null],
    ])('normaliza %s para %s', (raw, expected) => {
        expect(parseAdSenseStatus(raw)).toBe(expected)
    })
})
