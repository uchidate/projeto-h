// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import {
    CONSENT_STORAGE_KEY,
    __resetCmpParaTeste,
    applyConsent,
    getBannerState,
    hasCertifiedCmp,
    podeGuardarHistorico,
    readConsent,
    resetConsent,
    saveConsent,
    subscribeBanner,
} from './consent'

function instalarFundingChoices(gdprApplies: boolean) {
    ;(window as unknown as { __tcfapi?: unknown }).__tcfapi = (
        comando: string,
        _v: number,
        cb: (d: { gdprApplies: boolean } | null, ok: boolean) => void,
    ) => {
        if (comando === 'addEventListener') cb({ gdprApplies }, true)
    }
}

function sinaisEnfileirados() {
    return (window.dataLayer ?? []).filter(args => args[0] === 'consent')
}

describe('consent', () => {
    beforeEach(() => {
        localStorage.clear()
        window.dataLayer = []
        delete (window as unknown as { gtag?: unknown }).gtag
        delete (window as unknown as { __tcfapi?: unknown }).__tcfapi
        __resetCmpParaTeste()
    })

    it('sem registro, readConsent devolve null', () => {
        expect(readConsent()).toBeNull()
    })

    it('saveConsent persiste a decisão com data', () => {
        const estado = saveConsent('granted')
        expect(estado.decision).toBe('granted')
        expect(Number.isNaN(Date.parse(estado.at))).toBe(false)
        expect(readConsent()?.decision).toBe('granted')
    })

    it('ignora registro corrompido em vez de assumir consentimento', () => {
        localStorage.setItem(CONSENT_STORAGE_KEY, '{"decision":"talvez"}')
        expect(readConsent()).toBeNull()
        localStorage.setItem(CONSENT_STORAGE_KEY, 'não é json')
        expect(readConsent()).toBeNull()
    })

    it('enfileira os quatro sinais do Consent Mode v2', () => {
        applyConsent('granted')
        const [tipo, acao, sinais] = sinaisEnfileirados()[0] as [string, string, Record<string, string>]
        expect(tipo).toBe('consent')
        expect(acao).toBe('update')
        expect(sinais).toEqual({
            ad_storage: 'granted',
            ad_user_data: 'granted',
            ad_personalization: 'granted',
            analytics_storage: 'granted',
        })
    })

    it('resetConsent apaga o registro e volta ao estado negado', () => {
        saveConsent('granted')
        window.dataLayer = []
        resetConsent()
        expect(readConsent()).toBeNull()
        const [, , sinais] = sinaisEnfileirados()[0] as [string, string, Record<string, string>]
        expect(sinais.ad_storage).toBe('denied')
    })

    it('a presença do __tcfapi não basta: o que decide é gdprApplies', () => {
        // O Funding Choices instala o __tcfapi em todo visitante. Fora do EEE
        // ele responde gdprApplies=false e não exibe mensagem — ali o pedido
        // de consentimento continua sendo nosso.
        instalarFundingChoices(false)
        const cancelar = subscribeBanner(() => {})
        expect(hasCertifiedCmp()).toBe(false)
        expect(getBannerState()).toBe('perguntar')
        cancelar()
    })

    it('cede ao CMP do Google quando gdprApplies é true', () => {
        instalarFundingChoices(true)
        const cancelar = subscribeBanner(() => {})
        expect(hasCertifiedCmp()).toBe(true)
        expect(getBannerState()).toBe('oculto')
        cancelar()
    })

    describe('histórico "Continue de onde parou"', () => {
        it('fora do EEE vale enquanto a pessoa não recusa', () => {
            expect(podeGuardarHistorico()).toBe(true)
            saveConsent('granted')
            expect(podeGuardarHistorico()).toBe(true)
        })

        it('quem recusou não tem histórico', () => {
            saveConsent('denied')
            expect(podeGuardarHistorico()).toBe(false)
        })

        it('no EEE só com aceite explícito', () => {
            instalarFundingChoices(true)
            const cancelar = subscribeBanner(() => {})
            expect(hasCertifiedCmp()).toBe(true)
            expect(podeGuardarHistorico()).toBe(false)
            saveConsent('granted')
            expect(podeGuardarHistorico()).toBe(true)
            cancelar()
        })
    })

    it('fica calado enquanto o CMP ainda não respondeu', () => {
        const cancelar = subscribeBanner(() => {})
        expect(getBannerState()).toBe('oculto')
        cancelar()
    })

    it('não pergunta de novo a quem já decidiu, mesmo fora do EEE', () => {
        saveConsent('denied')
        instalarFundingChoices(false)
        const cancelar = subscribeBanner(() => {})
        expect(getBannerState()).toBe('oculto')
        cancelar()
    })
})
