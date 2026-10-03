// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import enMessages from '@/messages/en/client.json'
import { LoginForm } from './LoginForm'

// Sobrescreve o mock global de vitest.setup.ts (português) para inglês.
vi.mock('next-intl', async (importOriginal) => {
    const actual = await importOriginal<typeof import('next-intl')>()
    return {
        ...actual,
        useLocale: () => 'en',
        useTranslations: (namespace?: string) =>
            actual.createTranslator({ locale: 'en', messages: { client: enMessages }, namespace: namespace as never }),
    }
})
vi.mock('next-auth/react', () => ({ signIn: vi.fn() }))
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
    useSearchParams: () => new URLSearchParams(''),
}))

describe('LoginForm em inglês', () => {
    it('traduz a interface e aponta o cadastro para /en/sign-up', () => {
        render(<LoginForm />)
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
        expect(screen.getByLabelText('Password')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /create account/i })).toHaveAttribute(
            'href',
            `/en/sign-up?callbackUrl=${encodeURIComponent('/dashboard')}`,
        )
    })
})
