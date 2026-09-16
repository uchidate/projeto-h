const baseUrl = (process.env.LHCI_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')

module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      url: [`${baseUrl}/`, `${baseUrl}/blog`, `${baseUrl}/productions`],
      settings: { chromeFlags: '--headless --no-sandbox' },
    },
    assert: {
      assertions: {
        // Baseline de produção em 2026-07-15. Estes pisos bloqueiam regressão;
        // a meta permanece >= 0.90 e deve subir à medida que o backlog fecha.
        'categories:accessibility': ['error', { minScore: 0.85 }],
        'categories:best-practices': ['error', { minScore: 0.55 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.15 }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
}
