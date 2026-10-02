// O pacote não publica tipos; só `analyzeCommits` é usado, e apenas em lib/release/releaserc.test.ts.
declare module '@semantic-release/commit-analyzer' {
    export function analyzeCommits(pluginConfig: unknown, context: unknown): Promise<string | undefined>
}
