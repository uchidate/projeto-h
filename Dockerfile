FROM node:24-alpine AS base

# ── builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
# npm do `packageManager` do package.json, nao o que vem na imagem (11): lock
# gerado por outra versao diverge, e o npm 12 bloqueia scripts de instalacao
# fora do `allowScripts` — comportamento que precisa ser o mesmo do CI e local.
RUN npm install -g "$(node -p "require('./package.json').packageManager")"
# node_modules fica no cache BuildKit: o build usa-o diretamente e o standalone
# do Next.js copia apenas dependências de runtime para a imagem final.
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    --mount=type=cache,id=site-node-modules,target=/app/node_modules,sharing=locked \
    npm install --prefer-offline

COPY . .

ENV NEXT_PHASE=phase-production-build
ENV NEXT_TELEMETRY_DISABLED=1

# Sem esta URL, IS_BUILD fica verdadeiro e todo fetch ao WordPress devolve []
# durante o build — a home era pré-renderizada VAZIA e, por nunca ter feito
# fetch, saía sem tags de cache: revalidação sob demanda não a alcançava e só o
# timer do ISR a substituía. Com a URL, o build gera a página real e com tags.
ARG WORDPRESS_API_URL=""
ENV WORDPRESS_API_URL=$WORDPRESS_API_URL

# Release do Sentry no bundle do cliente. Variavel NEXT_PUBLIC_* e embutida no
# build, nao lida em runtime — por isso precisa entrar como build arg, ao
# contrario do servidor, que le GIT_COMMIT_SHA do ambiente do container.
ARG NEXT_PUBLIC_SENTRY_RELEASE=""
ENV NEXT_PUBLIC_SENTRY_RELEASE=$NEXT_PUBLIC_SENTRY_RELEASE
ARG SENTRY_ORG=""
ENV SENTRY_ORG=$SENTRY_ORG

# Piso de reuso do fetch-cache entre builds. Vazio = usa o padrao de 6h definido
# em lib/wordpress/config.ts; `0` desliga.
#
# Notícia (tag `posts` / `post-<slug>`) fica FORA do piso e e rebuscada a cada
# build — a assimetria esta explicada no config.
#
# O `.next/cache` abaixo ja e cache do BuildKit, entao ele SOBREVIVE entre
# builds — mas o revalidate de 600s do client vence antes do proximo deploy
# comecar, e o build rebusca os ~2.300 fetches do WordPress inteiros.
#
# Medido em 2026-09-12, com o cache em 2h de idade (a condicao real de um
# deploy), gerando as mesmas 886 paginas:
#
#   sem o piso     78s e 89s em dois runs
#   com piso de 6h        16,3s
#
# O que se paga e frescor do HTML pre-renderizado; ver WP_BUILD_FETCH_TTL_S em
# lib/wordpress/config.ts para o raciocinio e os dois mecanismos que limitam o
# estrago. Fica desligado ate alguem escolher o numero.
ARG WP_BUILD_FETCH_TTL_S=""
ENV WP_BUILD_FETCH_TTL_S=$WP_BUILD_FETCH_TTL_S

# Identidade do site (ver lib/constants/identidade.mjs). Nenhum valor real
# no repositorio: vem por --build-arg, lido de um arquivo no servidor pelo
# script de build. Sem elas o next.config.mjs aborta o build de producao.
ARG NEXT_PUBLIC_SITE_NAME=""
ENV NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME
ARG NEXT_PUBLIC_SITE_URL=""
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_STAGING_URL=""
ENV NEXT_PUBLIC_STAGING_URL=$NEXT_PUBLIC_STAGING_URL
ARG NEXT_PUBLIC_WORDPRESS_ORIGIN=""
ENV NEXT_PUBLIC_WORDPRESS_ORIGIN=$NEXT_PUBLIC_WORDPRESS_ORIGIN
ARG NEXT_PUBLIC_WORDPRESS_ADMIN_ORIGIN=""
ENV NEXT_PUBLIC_WORDPRESS_ADMIN_ORIGIN=$NEXT_PUBLIC_WORDPRESS_ADMIN_ORIGIN
ARG NEXT_PUBLIC_WP_API_NAMESPACE=""
ENV NEXT_PUBLIC_WP_API_NAMESPACE=$NEXT_PUBLIC_WP_API_NAMESPACE
ARG NEXT_PUBLIC_BLOCK_CSS_PREFIX=""
ENV NEXT_PUBLIC_BLOCK_CSS_PREFIX=$NEXT_PUBLIC_BLOCK_CSS_PREFIX
ARG NEXT_PUBLIC_BLOCK_ALT_PREFIX=""
ENV NEXT_PUBLIC_BLOCK_ALT_PREFIX=$NEXT_PUBLIC_BLOCK_ALT_PREFIX
ARG NEXT_PUBLIC_STORAGE_PREFIX=""
ENV NEXT_PUBLIC_STORAGE_PREFIX=$NEXT_PUBLIC_STORAGE_PREFIX
ARG NEXT_PUBLIC_LEGACY_STORAGE_PREFIX=""
ENV NEXT_PUBLIC_LEGACY_STORAGE_PREFIX=$NEXT_PUBLIC_LEGACY_STORAGE_PREFIX
ARG NEXT_PUBLIC_METRICS_PREFIX=""
ENV NEXT_PUBLIC_METRICS_PREFIX=$NEXT_PUBLIC_METRICS_PREFIX
ARG NEXT_PUBLIC_UMAMI_ORIGIN=""
ENV NEXT_PUBLIC_UMAMI_ORIGIN=$NEXT_PUBLIC_UMAMI_ORIGIN
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID=""
ENV NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID
ARG NEXT_PUBLIC_CONTACT_EMAIL=""
ENV NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL
ARG NEXT_PUBLIC_ADMIN_EMAILS=""
ENV NEXT_PUBLIC_ADMIN_EMAILS=$NEXT_PUBLIC_ADMIN_EMAILS
ARG NEXT_PUBLIC_ADSENSE_CLIENT=""
ENV NEXT_PUBLIC_ADSENSE_CLIENT=$NEXT_PUBLIC_ADSENSE_CLIENT

# Cache do Next.js entre builds — só recompila arquivos que mudaram
# Source maps do Sentry: o token entra como SECRET do BuildKit (fica fora das
# camadas e do `docker history`) e só existe durante este RUN. Sem o arquivo no
# servidor o secret vem vazio, `sourcemaps.disable` fica verdadeiro no
# next.config e o build segue igual — o token não é requisito para construir.
RUN --mount=type=cache,id=site-node-modules,target=/app/node_modules,sharing=locked \
    --mount=type=cache,target=/app/.next/cache \
    --mount=type=secret,id=sentry_auth_token \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token 2>/dev/null || true)" npm run build

# ── runner ────────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=6 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
