// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GooglePreferredSource } from './GooglePreferredSource'
import * as analytics from '@/lib/analytics'
import { GOOGLE_PREFERRED_SOURCE_URL } from '@/lib/constants/site'

describe('GooglePreferredSource', () => {
    it('linka pra URL de fonte preferida do Google, em nova aba', () => {
        render(<GooglePreferredSource postSlug="meu-post" />)
        const link = screen.getByRole('link', { name: /escolher o portal como fonte preferida/i })
        expect(link).toHaveAttribute('href', GOOGLE_PREFERRED_SOURCE_URL)
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('clicar dispara o tracking de analytics com o slug do post', async () => {
        const spy = vi.spyOn(analytics, 'trackPreferredSourceClick').mockImplementation(() => {})
        const user = userEvent.setup()
        render(<GooglePreferredSource postSlug="meu-post-especial" />)
        await user.click(screen.getByRole('link', { name: /escolher o portal como fonte preferida/i }))
        expect(spy).toHaveBeenCalledWith('meu-post-especial')
    })
})
