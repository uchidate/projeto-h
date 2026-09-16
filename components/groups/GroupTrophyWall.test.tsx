// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GroupTrophyWall } from './GroupTrophyWall'

describe('GroupTrophyWall', () => {
    it('não renderiza nada quando não há curiosidades (após filtrar HISTÓRICO)', () => {
        const { container } = render(<GroupTrophyWall curiosidades={['HISTÓRICO|fundado em 2013']} accent="#000" groupName="BTS" />)
        expect(container).toBeEmptyDOMElement()
    })

    it('não renderiza nada com array vazio', () => {
        const { container } = render(<GroupTrophyWall curiosidades={[]} accent="#000" groupName="BTS" />)
        expect(container).toBeEmptyDOMElement()
    })

    it('filtra entradas HISTÓRICO| e mostra só as conquistas', () => {
        render(<GroupTrophyWall curiosidades={['HISTÓRICO|fundado em 2013', 'Recorde no Guinness World Records']} accent="#000" groupName="BTS" />)
        expect(screen.getByText('1 conquista')).toBeInTheDocument()
        expect(screen.getByText('Recorde no Guinness World Records')).toBeInTheDocument()
        expect(screen.queryByText(/fundado em 2013/)).not.toBeInTheDocument()
    })

    it('categoriza corretamente por palavra-chave: youtube', () => {
        render(<GroupTrophyWall curiosidades={['MV com 1 bilhão de visualizações no YouTube']} accent="#000" groupName="X" />)
        expect(screen.getByText('YouTube')).toBeInTheDocument()
    })

    it('categoriza corretamente: billboard', () => {
        render(<GroupTrophyWall curiosidades={['Primeiro grupo a liderar a Billboard Hot 100']} accent="#000" groupName="X" />)
        expect(screen.getByText('Billboard')).toBeInTheDocument()
    })

    it('categoriza corretamente: guinness', () => {
        render(<GroupTrophyWall curiosidades={['Recorde mundial reconhecido pelo Guinness']} accent="#000" groupName="X" />)
        expect(screen.getByText('Guinness')).toBeInTheDocument()
    })

    it('categoriza corretamente: ao vivo (tour/coachella)', () => {
        render(<GroupTrophyWall curiosidades={['Primeira apresentação no Coachella']} accent="#000" groupName="X" />)
        expect(screen.getByText('Ao Vivo')).toBeInTheDocument()
    })

    it('categoriza corretamente: realeza', () => {
        render(<GroupTrophyWall curiosidades={['Condecorou o grupo em Buckingham']} accent="#000" groupName="X" />)
        expect(screen.getByText('Realeza')).toBeInTheDocument()
    })

    it('não confunde "rei" dentro de fevereiro/Coreia com Realeza', () => {
        render(<GroupTrophyWall
            curiosidades={['Fundou a própria gravadora em fevereiro de 2024', 'Vendeu 385.501 cópias no primeiro dia na Coreia do Sul']}
            accent="#000" groupName="X" />)
        expect(screen.queryByText('Realeza')).not.toBeInTheDocument()
        expect(screen.getAllByText('Recorde')).toHaveLength(2)
    })

    it('categoriza corretamente: streaming', () => {
        render(<GroupTrophyWall curiosidades={['Mais de 5 bilhões de streams no Spotify']} accent="#000" groupName="X" />)
        expect(screen.getByText('Streaming')).toBeInTheDocument()
    })

    it('cai no fallback "Recorde" quando nenhuma palavra-chave é detectada', () => {
        render(<GroupTrophyWall curiosidades={['Algo genérico sem palavras-chave']} accent="#000" groupName="X" />)
        expect(screen.getByText('Recorde')).toBeInTheDocument()
    })

    it('omite o fato cujo número já aparece como métrica', () => {
        render(<GroupTrophyWall
            curiosidades={['O álbum "Me" vendeu 1,17 milhão de cópias', 'Estreou em 2016 pela YG']}
            shownMetricValues={['1,17 milhão']}
            accent="#000" groupName="X" />)
        expect(screen.queryByText(/1,17 milhão/)).not.toBeInTheDocument()
        expect(screen.getByText(/Estreou em 2016/)).toBeInTheDocument()
    })

    it('não deduplica com valores curtos demais para identificar um fato', () => {
        render(<GroupTrophyWall
            curiosidades={['Liderou o iTunes em 45 regiões', 'Ficou em nº 2 na Billboard']}
            shownMetricValues={['45', 'nº 2']}
            accent="#000" groupName="X" />)
        expect(screen.getByText(/45 regiões/)).toBeInTheDocument()
        expect(screen.getByText(/nº 2 na Billboard/)).toBeInTheDocument()
    })

    it('mostra o nome do grupo no rodapé', () => {
        render(<GroupTrophyWall curiosidades={['Recorde qualquer']} accent="#000" groupName="BLACKPINK" />)
        expect(screen.getByText(/blackpink · conquistas verificadas/i)).toBeInTheDocument()
    })

    it('conta várias conquistas corretamente', () => {
        render(<GroupTrophyWall curiosidades={['Guinness recorde', 'Billboard hot 100', 'HISTÓRICO|fundado']} accent="#000" groupName="X" />)
        expect(screen.getByText('2 conquistas')).toBeInTheDocument()
    })
})
