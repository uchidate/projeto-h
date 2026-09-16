import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: 'class',
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            // ── Escala tipográfica editorial da home ──────────────────────
            // Fluida via clamp(): uma classe cobre mobile→desktop, sem
            // precisar empilhar sm:/lg: text-[Npx] em cada componente.
            fontSize: {
                'home-hero':     ['clamp(2rem, 1.35rem + 3vw, 3rem)',       { lineHeight: '0.97', letterSpacing: '-0.04em' }],
                'home-hero-xl':  ['clamp(2rem, 1rem + 5vw, 3.5rem)',        { lineHeight: '0.95', letterSpacing: '-0.045em' }],
                'home-title-lg': ['clamp(1.25rem, 1rem + 1vw, 1.5rem)',     { lineHeight: '1.1', letterSpacing: '-0.03em' }],
                'home-title':    ['clamp(1rem, 0.85rem + 0.6vw, 1.375rem)', { lineHeight: '1.15', letterSpacing: '-0.025em' }],
                'home-title-sm': ['0.9375rem',                              { lineHeight: '1.2', letterSpacing: '-0.02em' }],
                'home-body-lg':  ['0.9375rem',                              { lineHeight: '1.65' }],
                'home-body':     ['0.8125rem',                              { lineHeight: '1.5' }],
                'home-label':    ['0.6875rem',                              { lineHeight: '1', letterSpacing: '0.12em' }],
                // ── Escala do hero de perfil (artista/grupo) ──────────────────
                'profile-meta':  ['clamp(0.8125rem, 0.75rem + 0.3vw, 0.9375rem)', { lineHeight: '1.3' }],
                'profile-copy':  ['clamp(0.875rem, 0.8rem + 0.35vw, 1rem)',       { lineHeight: '1.5' }],
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'sans-serif'],
                display: ['var(--font-outfit)', 'sans-serif'],
                sora: ['var(--font-sora)', 'sans-serif'],
                serif: ['var(--font-playfair)', 'Georgia', 'serif'],
            },
            colors: {
                background:          'var(--color-bg)',
                surface:             'var(--color-surface)',
                'surface-hover':     'var(--color-surface-hover)',
                border:              'var(--color-border)',
                'border-strong':     'var(--color-border-strong)',
                'home-frame':        'var(--color-home-frame)',
                foreground:          'var(--color-fg)',
                'foreground-subtle': 'var(--color-fg-subtle)',
                muted:               'var(--color-muted)',
                accent:              'var(--color-accent)',
                'accent-soft':       'var(--color-accent-soft)',
                'accent-strong':     'var(--color-accent-strong)',
                'accent-a11y':       'var(--color-accent-a11y)',
                cyan:                'var(--color-cyan)',
                violet:              'var(--color-violet)',
                gold:                'var(--color-gold)',
                'ink-panel':         'var(--color-ink-panel)',
                'surface-editorial': 'var(--color-surface-editorial)',
                'surface-media':     'var(--color-surface-media)',
                'surface-tint':      'var(--color-surface-tint)',
                'featured':          'var(--color-featured-bg)',
                'featured-fg':       'var(--color-featured-fg)',
                'featured-muted':    'var(--color-featured-muted)',
                'featured-border':   'var(--color-featured-border)',
                skeleton:            'var(--color-skeleton)',
                overlay:             'var(--color-overlay)',
                hallyu: {
                    pink:     '#ff2d78',
                    'pink-2': '#ff6fa3',
                    'pink-3': '#fff0f5',
                    dark:     '#080808',
                    muted:    '#6b6b6b',
                    border:   '#e8e8e8',
                    bg:       '#f5f5f7',
                },
                purple: {
                    400: '#c084fc',
                    500: '#bc13fe',
                    600: '#9333ea',
                    900: '#581c87',
                },
                cyber: { purple: '#bc13fe', DEFAULT: '#bc13fe' },
                neon:  { pink: '#ff00ff', cyan: '#00f3ff', green: '#39ff14' },
                dark:  { bg: '#050505', card: '#121212' },
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":  "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "hero-glow":       "radial-gradient(circle at center, rgba(188, 19, 254, 0.25) 0%, transparent 60%)",
                "neon-flow":       "linear-gradient(to right, #bc13fe, #ff00ff, #00f3ff)",
            },
            boxShadow: {
                'glass':      '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                'neon-hover': '0 0 40px -10px rgba(188, 19, 254, 0.3)',
                'glow-white': '0 0 30px rgba(255, 255, 255, 0.4)',
            },
            animation: {
                'pulse-slow':   'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float':        'float 6s ease-in-out infinite',
                'glow':         'glow 2s ease-in-out infinite alternate',
                'shimmer':      'shimmer 2s infinite linear',
                'gradient':     'gradient 8s linear infinite',
                'home-ticker':  'home-ticker 42s linear infinite',
                'home-marquee': 'home-marquee 24s linear infinite',
                'slideUp':      'slideUp 300ms ease-out',
                'fadeInUp':     'fadeInUp 350ms ease-out',
                'equalizador':  'equalizador 0.6s ease-in-out infinite',
            },
            keyframes: {
                float:          { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-20px)' } },
                glow:           { from: { boxShadow: '0 0 10px #bc13fe, 0 0 20px #bc13fe' }, to: { boxShadow: '0 0 20px #ff00ff, 0 0 30px #ff00ff' } },
                shimmer:        { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } },
                gradient:       { '0%, 100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
                'home-ticker':  { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
                'home-marquee': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
                slideUp:        { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
                fadeInUp:       { '0%': { transform: 'translateY(24px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
                equalizador:    { '0%, 100%': { transform: 'scaleY(0.4)' }, '50%': { transform: 'scaleY(1)' } },
            },
            // ── Tema editorial para artigos vindo do WordPress ──────────────
            // Todos os valores usam CSS variables do design system do OC.
            // As variáveis já mudam com .dark — prose e prose-invert apontam
            // para as mesmas variáveis, sem necessidade de duplicar valores.
            typography: {
                DEFAULT: {
                    css: {
                        // ── Tokens de cor ────────────────────────────────────
                        '--tw-prose-body':                   'var(--color-fg)',
                        '--tw-prose-headings':               'var(--color-fg)',
                        '--tw-prose-lead':                   'var(--color-fg-subtle)',
                        '--tw-prose-links':                  'var(--color-accent)',
                        '--tw-prose-bold':                   'var(--color-fg)',
                        '--tw-prose-counters':               'var(--color-muted)',
                        '--tw-prose-bullets':                'var(--color-accent)',
                        '--tw-prose-hr':                     'var(--color-border)',
                        '--tw-prose-quotes':                 'var(--color-fg)',
                        '--tw-prose-quote-borders':          'var(--color-accent)',
                        '--tw-prose-captions':               'var(--color-muted)',
                        '--tw-prose-code':                   'var(--color-fg)',
                        '--tw-prose-pre-code':               'var(--color-fg)',
                        '--tw-prose-pre-bg':                 'var(--color-surface)',
                        '--tw-prose-th-borders':             'var(--color-border)',
                        '--tw-prose-td-borders':             'var(--color-border)',
                        // prose-invert — mesmas variáveis, já theme-aware via .dark
                        '--tw-prose-invert-body':            'var(--color-fg)',
                        '--tw-prose-invert-headings':        'var(--color-fg)',
                        '--tw-prose-invert-lead':            'var(--color-fg-subtle)',
                        '--tw-prose-invert-links':           'var(--color-accent)',
                        '--tw-prose-invert-bold':            'var(--color-fg)',
                        '--tw-prose-invert-counters':        'var(--color-muted)',
                        '--tw-prose-invert-bullets':         'var(--color-accent)',
                        '--tw-prose-invert-hr':              'var(--color-border)',
                        '--tw-prose-invert-quotes':          'var(--color-fg)',
                        '--tw-prose-invert-quote-borders':   'var(--color-accent)',
                        '--tw-prose-invert-captions':        'var(--color-muted)',
                        '--tw-prose-invert-code':            'var(--color-fg)',
                        '--tw-prose-invert-pre-code':        'var(--color-fg)',
                        '--tw-prose-invert-pre-bg':          'var(--color-surface)',
                        '--tw-prose-invert-th-borders':      'var(--color-border)',
                        '--tw-prose-invert-td-borders':      'var(--color-border)',
                        // ── Tipografia base ───────────────────────────────────
                        fontSize:   '1.0625rem',  // 17px
                        lineHeight: '1.45',
                        // text-align: justify vive em globals.css atrás de
                        // min-width 640px — em coluna de 390px abre "rios"
                        maxWidth:   'none',
                        // ── Parágrafos ────────────────────────────────────────
                        p: { marginTop: '0', marginBottom: '1.5em' },
                        // ── H2 — divisor de capítulo ──────────────────────────
                        h2: {
                            fontSize:      '1.5rem',
                            fontWeight:    '900',
                            letterSpacing: '-0.03em',
                            lineHeight:    '1.3',
                            marginTop:     '2.75rem',
                            marginBottom:  '0.75rem',
                            paddingBottom: '0.5rem',
                            borderBottom:  '1px solid var(--color-border)',
                        },
                        // ── H3 ────────────────────────────────────────────────
                        h3: {
                            fontSize:      '1.125rem',
                            fontWeight:    '900',
                            letterSpacing: '-0.02em',
                            lineHeight:    '1.4',
                            marginTop:     '2.25rem',
                            marginBottom:  '0.5rem',
                        },
                        // ── H4 ────────────────────────────────────────────────
                        h4: {
                            fontSize:      '1rem',
                            fontWeight:    '800',
                            letterSpacing: '-0.01em',
                            marginTop:     '1.75rem',
                            marginBottom:  '0.4rem',
                        },
                        // ── Blockquote — pull quote editorial forte ────────────
                        blockquote: {
                            fontStyle:       'normal',
                            fontWeight:      '800',
                            fontSize:        '1.3rem',
                            lineHeight:      '1.6',
                            borderLeftWidth: '5px',
                            borderLeftColor: 'var(--color-accent)',
                            paddingLeft:     '1.5rem',
                            paddingTop:      '1rem',
                            paddingBottom:   '1rem',
                            paddingRight:    '1rem',
                            marginTop:       '2.5rem',
                            marginBottom:    '2.5rem',
                            color:           'var(--color-fg)',
                            backgroundColor: 'var(--color-surface-editorial)',
                            quotes:          'none',
                        },
                        'blockquote p:first-of-type::before': { content: 'none' },
                        'blockquote p:last-of-type::after':   { content: 'none' },
                        // ── Listas ────────────────────────────────────────────
                        ul: { marginTop: '0.75em', marginBottom: '1.25em', paddingLeft: '1.5em' },
                        ol: { marginTop: '0.75em', marginBottom: '1.25em', paddingLeft: '1.5em' },
                        li: { marginTop: '0.35em', marginBottom: '0.35em' },
                        'ul > li::marker': { color: 'var(--color-accent)' },
                        'ol > li::marker': { color: 'var(--color-muted)', fontWeight: '700' },
                        // ── Imagens e figuras ─────────────────────────────────
                        img: {
                            borderRadius: '0',
                            marginTop:    '2rem',
                            marginBottom: '0.5rem',
                            border:       '1px solid var(--color-border)',
                        },
                        figure: { marginTop: '2rem', marginBottom: '2rem' },
                        figcaption: {
                            fontSize:      '0.6875rem',
                            fontFamily:    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            letterSpacing: '0.03em',
                            color:         'var(--color-muted)',
                            marginTop:     '0.6rem',
                            lineHeight:    '1.55',
                        },
                        // ── Links ─────────────────────────────────────────────
                        a: {
                            color:          'var(--color-accent)',
                            textDecoration: 'none',
                            fontWeight:     '600',
                            '&:hover':      { textDecoration: 'underline' },
                        },
                        // ── HR ────────────────────────────────────────────────
                        hr: {
                            borderColor:  'var(--color-border)',
                            marginTop:    '2.5rem',
                            marginBottom: '2.5rem',
                        },
                        // ── Código inline ─────────────────────────────────────
                        code: {
                            fontSize:        '0.875em',
                            fontWeight:      '600',
                            backgroundColor: 'var(--color-surface)',
                            padding:         '0.15em 0.4em',
                            borderRadius:    '3px',
                            border:          '1px solid var(--color-border)',
                        },
                        'code::before': { content: 'none' },
                        'code::after':  { content: 'none' },
                        // ── Tabela ────────────────────────────────────────────
                        table:          { fontSize: '0.9em' },
                        thead:          { borderBottomColor: 'var(--color-border-strong)' },
                        'thead th':     { color: 'var(--color-fg)', fontWeight: '800' },
                        'tbody tr':     { borderBottomColor: 'var(--color-border)' },
                    },
                },
            },
        },
    },
    plugins: [require('@tailwindcss/typography')],
};
export default config;
