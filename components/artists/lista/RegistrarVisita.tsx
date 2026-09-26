'use client'

import { useEffect } from 'react'
import { registrarVisita, type Recente } from '@/lib/artists/recentes'

/** Na ficha: guarda o artista no histórico do navegador para a faixa "Continue de onde parou". */
export function RegistrarVisita({ item }: { item: Recente }) {
    const { slug, nome, foto, papel } = item
    useEffect(() => { registrarVisita({ slug, nome, foto, papel }) }, [slug, nome, foto, papel])
    return null
}
