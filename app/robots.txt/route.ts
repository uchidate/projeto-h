import { SITE_URL } from '@/lib/constants/site'

// Era public/robots.txt; virou rota para o dominio dos sitemaps vir da
// configuracao (identidade.mjs). Conteudo estatico: gerado no build.
export const dynamic = 'force-static'

const ROBOTS = `User-agent: *
Allow: /

# API não é conteúdo indexável
Disallow: /api/

# Páginas privadas e busca permanecem rastreáveis para o Google ler noindex.
# Autenticação protege os dados; robots.txt não é controle de acesso.

# ── Robôs de IA ────────────────────────────────────────────────────────────
# Busca e resposta com citação (trazem visitas): liberados.
# Treino de modelo (não trazem visitas): negados.
# Decisão de 2026-09-15; o bloqueio geral na borda do Cloudflare foi desligado
# para este arquivo passar a valer.

User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Perplexity-User
User-agent: PetalBot
Allow: /
Disallow: /api/

User-agent: GPTBot
User-agent: ClaudeBot
User-agent: CCBot
User-agent: Bytespider
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: Meta-ExternalAgent
User-agent: Amazonbot
User-agent: cohere-ai
User-agent: Diffbot
Disallow: /

# Sitemap
Sitemap: ${SITE_URL}/sitemap-static.xml
Sitemap: ${SITE_URL}/sitemap-news.xml
`

export function GET() {
    return new Response(ROBOTS, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
