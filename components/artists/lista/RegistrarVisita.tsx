'use client'

import { useEffect } from 'react'
import { registrarVisita, type Recente } from '@/lib/artists/recentes'
import { podeGuardarHistorico } from '@/lib/consent'

/** Na ficha: guarda o artista no histórico do navegador para a faixa "Continue de onde parou". */
export function RegistrarVisita({ item }: { item: Recente }) {
    const { slug, nome, foto, papel, tipo, categoria } = item
    useEffect(() => {
        if (podeGuardarHistorico()) registrarVisita({ slug, nome, foto, papel, ...(tipo ? { tipo } : {}), ...(categoria ? { categoria } : {}) })
    }, [slug, nome, foto, papel, tipo, categoria])
    return null
}
