'use client'

import { useEffect } from 'react'
import { marcarPerfilTecnico } from '@/lib/analytics'
import { motivoDoRobo, versaoDoChrome } from '@/lib/robo-evidente'

/**
 * Marca a sessão no Umami com o perfil técnico, uma vez por carregamento.
 *
 * O robô não é omitido (o dono precisa ver o acesso indevido): ele aparece e
 * dá para filtrar. `trafego = robo_evidente` pega quem se entrega (webdriver,
 * HeadlessChrome, UA vazio); `chrome_versao` agrupa o crawler que falsifica um
 * Chrome defasado (em 2026-11, Chrome/145 enquanto o real era 156/157).
 */
export function SinalDeRobo() {
    useEffect(() => {
        const motivo = motivoDoRobo(navigator)
        const versao = versaoDoChrome(navigator.userAgent)
        const dados: Record<string, string | number> = {}
        if (motivo) { dados.trafego = 'robo_evidente'; dados.motivo = motivo }
        if (versao) dados.chrome_versao = versao
        if (Object.keys(dados).length > 0) marcarPerfilTecnico(dados)
    }, [])

    return null
}
