// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SiteError from './error'

const { captureException } = vi.hoisted(() => ({ captureException: vi.fn() }))

// A fronteira reporta por capturarErro, que carrega o SDK sob demanda.
vi.mock('@/lib/sentryCliente', () => ({ capturarErro: captureException }))
vi.mock('next/link', () => ({
    default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a href={String(href)} {...props}>{children}</a>
    ),
}))

describe('SiteError', () => {
    beforeEach(() => captureException.mockClear())

    it('registra a falha no Sentry com a fronteira e o digest', () => {
        const error = Object.assign(new Error('render failed'), { digest: 'digest-123' })
        render(<SiteError error={error} reset={vi.fn()} />)

        expect(captureException).toHaveBeenCalledOnce()
        expect(captureException).toHaveBeenCalledWith(error, {
            tags: { error_boundary: 'site' },
            extra: { digest: 'digest-123' },
        })
    })

    it('permite tentar novamente e oferece retorno à página inicial', async () => {
        const reset = vi.fn()
        render(<SiteError error={new Error('failed')} reset={reset} />)

        await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }))
        expect(reset).toHaveBeenCalledOnce()
        expect(screen.getByRole('link', { name: /página inicial/i })).toHaveAttribute('href', '/')
    })
})
