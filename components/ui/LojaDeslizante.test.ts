import { describe, it, expect } from 'vitest'
import { sobrepoe } from './LojaDeslizante'

const r = (left: number, top: number, right: number, bottom: number) => ({ left, top, right, bottom })

describe('sobrepoe', () => {
    it('detecta cruzamento', () => {
        expect(sobrepoe(r(0, 0, 100, 100), r(50, 50, 150, 150))).toBe(true)
    })
    it('ignora retângulos separados e que só encostam', () => {
        expect(sobrepoe(r(0, 0, 100, 100), r(200, 0, 300, 100))).toBe(false)
        expect(sobrepoe(r(0, 0, 100, 100), r(100, 0, 200, 100))).toBe(false)
        expect(sobrepoe(r(0, 0, 100, 100), r(0, 100, 100, 200))).toBe(false)
    })
})
