import { describe, expect, it } from 'vitest'
import { ambienteDoHost, ambienteDoServidor } from './sentryAmbiente'

describe('ambienteDoHost', () => {
    it('separa staging de produção pelo host, já que o bundle é o mesmo', () => {
        expect(ambienteDoHost('www.example.com')).toBe('production')
        expect(ambienteDoHost('example.com')).toBe('production')
        expect(ambienteDoHost('staging.example.com')).toBe('staging')
        expect(ambienteDoHost('STAGING.example.com')).toBe('staging')
    })

    it('máquina local é development', () => {
        expect(ambienteDoHost('localhost')).toBe('development')
        expect(ambienteDoHost('127.0.0.1')).toBe('development')
    })
})

describe('ambienteDoServidor', () => {
    it('usa SENTRY_ENVIRONMENT quando o deploy define', () => {
        expect(ambienteDoServidor({ SENTRY_ENVIRONMENT: 'staging', NODE_ENV: 'production' })).toBe('staging')
    })

    it('sem a variável, cai no NODE_ENV', () => {
        expect(ambienteDoServidor({ NODE_ENV: 'production' })).toBe('production')
        expect(ambienteDoServidor({ NODE_ENV: 'development' })).toBe('development')
    })
})
