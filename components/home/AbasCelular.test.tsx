// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AbasCelular } from './AbasCelular'

const abas = [{ chave: 'a', rotulo: 'Aba A' }, { chave: 'b', rotulo: 'Aba B' }]

describe('AbasCelular', () => {
    it('mostra o primeiro painel e esconde os outros só no celular', () => {
        render(<AbasCelular abas={abas} rotulo="Grupo"><p>um</p><p>dois</p></AbasCelular>)
        expect(screen.getByText('um').parentElement?.className).toBe('contents')
        expect(screen.getByText('dois').parentElement?.className).toBe('hidden lg:contents')
        expect(screen.getByRole('button', { name: 'Aba A' }).getAttribute('aria-pressed')).toBe('true')
    })
    it('troca o painel ao tocar na aba', () => {
        render(<AbasCelular abas={abas} rotulo="Grupo"><p>um</p><p>dois</p></AbasCelular>)
        fireEvent.click(screen.getByRole('button', { name: 'Aba B' }))
        expect(screen.getByText('dois').parentElement?.className).toBe('contents')
        expect(screen.getByText('um').parentElement?.className).toBe('hidden lg:contents')
    })
    it('com um painel só não cria abas', () => {
        render(<AbasCelular abas={abas.slice(0, 1)} rotulo="Grupo">{false}<p>um</p></AbasCelular>)
        expect(screen.queryByRole('button')).toBeNull()
    })
})
