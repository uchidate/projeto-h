'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { WORDPRESS_ADMIN_URL } from '@/lib/constants/site'

const POST_TYPE_PATH: Record<string, string> = {
    production:    'production',
    artist:        'artist',
    group:         'group',
    agency:        'agency',
    post:          'post',
    guia:          'guia',
    music_release: 'music_release',
}

interface WpEditCtx {
    editUrl: string | null
    setEdit: (postId: number, postType: string) => void
    clearEdit: () => void
}

const Ctx = createContext<WpEditCtx>({ editUrl: null, setEdit: () => {}, clearEdit: () => {} })

export function WpEditProvider({ children }: { children: ReactNode }) {
    const [editUrl, setEditUrl] = useState<string | null>(null)

    const setEdit = (postId: number, postType: string) => {
        if (postId && POST_TYPE_PATH[postType]) {
            setEditUrl(`${WORDPRESS_ADMIN_URL}/post.php?post=${postId}&action=edit`)
        }
    }

    const clearEdit = () => setEditUrl(null)

    return <Ctx.Provider value={{ editUrl, setEdit, clearEdit }}>{children}</Ctx.Provider>
}

export function useWpEdit() {
    return useContext(Ctx)
}

// Renderizado em cada página de detalhe — registra o post no contexto ao montar, limpa ao desmontar
export function WpEditSetter({ postId, postType }: { postId: number; postType: string }) {
    const { setEdit, clearEdit } = useWpEdit()

    useEffect(() => {
        setEdit(postId, postType)
        return () => clearEdit()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só o post identifica o contexto; setEdit/clearEdit vêm do provider e incluí-los reexecutaria o efeito a cada render dele
    }, [postId, postType])

    return null
}
