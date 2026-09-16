// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WpEditProvider, WpEditSetter, useWpEdit } from './WpEditContext'

function EditUrlDisplay() {
    const { editUrl } = useWpEdit()
    return <span>{editUrl ?? 'sem-edit-url'}</span>
}

describe('WpEditContext', () => {
    it('editUrl começa null fora de qualquer WpEditSetter', () => {
        render(
            <WpEditProvider>
                <EditUrlDisplay />
            </WpEditProvider>,
        )
        expect(screen.getByText('sem-edit-url')).toBeInTheDocument()
    })

    it('WpEditSetter define a editUrl com o postId e post_type válidos', () => {
        render(
            <WpEditProvider>
                <WpEditSetter postId={42} postType="production" />
                <EditUrlDisplay />
            </WpEditProvider>,
        )
        expect(screen.getByText('https://cms.example.com/wp-admin/post.php?post=42&action=edit')).toBeInTheDocument()
    })

    it('não define editUrl para post_type desconhecido', () => {
        render(
            <WpEditProvider>
                <WpEditSetter postId={42} postType="tipo-invalido" />
                <EditUrlDisplay />
            </WpEditProvider>,
        )
        expect(screen.getByText('sem-edit-url')).toBeInTheDocument()
    })

    it('não define editUrl quando postId é 0', () => {
        render(
            <WpEditProvider>
                <WpEditSetter postId={0} postType="production" />
                <EditUrlDisplay />
            </WpEditProvider>,
        )
        expect(screen.getByText('sem-edit-url')).toBeInTheDocument()
    })

    it('limpa a editUrl ao desmontar o WpEditSetter', () => {
        const { rerender } = render(
            <WpEditProvider>
                <WpEditSetter postId={42} postType="production" />
                <EditUrlDisplay />
            </WpEditProvider>,
        )
        expect(screen.queryByText('sem-edit-url')).not.toBeInTheDocument()

        rerender(
            <WpEditProvider>
                <EditUrlDisplay />
            </WpEditProvider>,
        )
        expect(screen.getByText('sem-edit-url')).toBeInTheDocument()
    })

    it('funciona com todos os post types válidos mapeados', () => {
        const validTypes = ['production', 'artist', 'group', 'agency', 'post', 'guia', 'music_release']
        for (const postType of validTypes) {
            const { unmount } = render(
                <WpEditProvider>
                    <WpEditSetter postId={1} postType={postType} />
                    <EditUrlDisplay />
                </WpEditProvider>,
            )
            expect(screen.queryByText('sem-edit-url')).not.toBeInTheDocument()
            unmount()
        }
    })
})
