import { describe, expect, it } from 'vitest'
import { roboEvidente } from './robo-evidente'

const chrome = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36'

describe('roboEvidente', () => {
    it('deixa passar navegador comum', () => {
        expect(roboEvidente({ webdriver: false, userAgent: chrome })).toBe(false)
    })
    it('pega webdriver, HeadlessChrome e User-Agent vazio', () => {
        expect(roboEvidente({ webdriver: true, userAgent: chrome })).toBe(true)
        expect(roboEvidente({ webdriver: false, userAgent: chrome.replace('Chrome/', 'HeadlessChrome/') })).toBe(true)
        expect(roboEvidente({ webdriver: false, userAgent: '' })).toBe(true)
    })
})
