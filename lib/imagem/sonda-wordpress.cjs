// Carregado só pelo `npm run build` dentro do Dockerfile (via NODE_OPTIONS), nunca
// pelo site em execução.
//
// Quando o build roda fora do servidor, o WordPress responde 403 às consultas: o
// endereço é de datacenter. Este arquivo acrescenta o cabeçalho das automações, e
// só nas chamadas à origem do WordPress. Sem nome, token ou URL, não faz nada.
//
// Fica abaixo do `fetch` do Next, que calcula a chave do cache antes de chegar
// aqui: o token não entra no `.next/cache` nem na imagem.
'use strict'

const fs = require('node:fs')

function lerToken(arquivo, ler) {
    try {
        return String(ler(arquivo, 'utf8')).trim()
    } catch {
        return ''
    }
}

function origemDe(endereco) {
    try {
        return new URL(endereco).origin
    } catch {
        return null
    }
}

function instalarSonda({ url, cabecalho, arquivo, alvo = globalThis, ler = fs.readFileSync }) {
    if (!url || !cabecalho || !arquivo) return false
    const origem = origemDe(url)
    const token = lerToken(arquivo, ler)
    if (!origem || !token) return false

    const original = alvo.fetch
    alvo.fetch = function fetchComSonda(entrada, init) {
        const pedido = entrada instanceof Request ? entrada : null
        if (origemDe(pedido ? pedido.url : String(entrada)) !== origem) {
            return original.call(this, entrada, init)
        }
        const headers = new Headers(init?.headers ?? pedido?.headers)
        headers.set(cabecalho, token)
        return original.call(this, entrada, { ...init, headers })
    }
    return true
}

instalarSonda({
    url: process.env.WORDPRESS_API_URL,
    cabecalho: process.env.BUILD_PROBE_HEADER,
    arquivo: process.env.BUILD_PROBE_TOKEN_FILE,
})

module.exports = { instalarSonda }
