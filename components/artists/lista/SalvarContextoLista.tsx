'use client'

import { useEffect } from 'react'
import { salvarContexto, type ContextoLista } from '@/lib/artists/listaContexto'

/** Na lista: lembra a ordem e o filtro para a ficha oferecer "anterior" e "próximo". */
export function SalvarContextoLista({ contexto }: { contexto: ContextoLista }) {
    const chave = JSON.stringify(contexto)
    useEffect(() => { salvarContexto(JSON.parse(chave)) }, [chave])
    return null
}
