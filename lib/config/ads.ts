export type AdPlacement = 'inline' | 'article_sidebar' | 'post_suggestion' | 'leaderboard' | 'sticky'

// Identificadores semânticos. Os IDs reais vêm do WordPress em tempo de execução.
export const ADSENSE = {
    enabled: false,
    client: '',
    slots: {
        inline: 'inline',
        article_sidebar: 'article_sidebar',
        post_suggestion: 'post_suggestion',
        leaderboard: 'leaderboard',
        sticky: 'sticky',
    },
} as const
