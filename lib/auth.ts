import { type NextAuthOptions, type DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { WP_API_URL } from '@/lib/wordpress/config'
import { clientIp } from '@/lib/http/clientIp'

const WP_BASE = WP_API_URL

declare module 'next-auth' {
    // `token` de propósito ausente: a credencial do WP fica só no JWT (cookie
    // httpOnly) e é resolvida no servidor por getWpToken. Enquanto ela vivia
    // aqui, /api/auth/session a entregava a qualquer script da página.
    interface Session extends DefaultSession {
        user: {
            id: string
            bio?: string
            roles?: string[]
        } & DefaultSession['user']
    }
    interface User {
        id: string
        token: string
        bio?: string
        roles?: string[]
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string
        token: string
        bio?: string
        roles?: string[]
    }
}

// Extraído do provider (em vez de inline) porque CredentialsProvider() do
// next-auth substitui a função authorize interna por um wrapper próprio no
// objeto retornado — provider.authorize não é mais essa função depois de
// passar por ali, então testar via authOptions.providers[0] não é possível.
// Exportar authorizeCredentials separadamente permite testar a lógica de
// login (que faz uma chamada de rede autenticando contra o WP) diretamente.
type AuthorizeRequest = { headers?: Record<string, string | string[] | undefined> }

export async function authorizeCredentials(
    credentials: Record<string, string> | undefined,
    req?: AuthorizeRequest,
) {
    if (!credentials?.username || !credentials?.password) return null
    try {
        const ip = clientIp(req?.headers)
        const res = await fetch(`${WP_BASE}/oc/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // O throttle de brute force do WP conta por IP. Sem repassar o do
                // visitante, todo login sai do IP deste container e um único
                // atacante bloquearia o login do site inteiro.
                ...(ip ? { 'X-Forwarded-For': ip } : {}),
            },
            signal: AbortSignal.timeout(8000),
            body: JSON.stringify({
                username: credentials.username,
                password: credentials.password,
            }),
        })
        if (!res.ok) return null
        const data = await res.json()
        if (!data.token) return null
        return {
            id: String(data.userId),
            name: data.name,
            email: data.email,
            image: data.avatar,
            token: data.token,
            bio: data.bio ?? '',
            roles: data.roles ?? [],
        }
    } catch { return null }
}

/**
 * Troca a identidade verificada do Google por uma sessão do WordPress.
 *
 * O WP é a fonte de verdade das contas: todo dado do usuário (listas,
 * conquistas, perfil) é lido com o token dele. Uma sessão do NextAuth sem esse
 * token seria um login que não dá acesso a nada — o usuário entraria e veria a
 * Minha Onda vazia.
 *
 * Quem valida o id_token é o WP, não este código. Ver /oc/v1/auth/google: a
 * verificação precisa acontecer do lado que emite o token de sessão.
 */
export async function trocarGooglePorSessaoWp(idToken: string) {
    try {
        const res = await fetch(`${WP_BASE}/oc/v1/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(8000),
            body: JSON.stringify({ id_token: idToken }),
        })
        if (!res.ok) return null
        const data = await res.json()
        return data?.token ? data : null
    } catch { return null }
}

const googleConfigurado = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET

export const authOptions: NextAuthOptions = {
    // 30 dias, casado com oc_session_ttl() do plugin de blocos do WordPress. Os dois
    // prazos TÊM que andar juntos: se o cookie do NextAuth sobreviver ao token
    // do WP, a sessão parece válida e toda chamada autenticada falha — o
    // usuário fica "logado" numa Minha Onda vazia, que é pior do que deslogar.
    //
    // Eram 7 dias dos dois lados. Curto demais para site de conteúdo: o leitor
    // semanal que atrasa dois dias volta deslogado. O lado do WP renova de
    // forma deslizante a cada uso, então quem volta dentro do prazo nunca cai.
    session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
    pages: {
        signIn: '/entrar',
        error: '/entrar',
    },
    providers: [
        // Condicional: sem as credenciais o botão do Google não aparece e o
        // login por senha segue igual. Registrar o provider sem elas faria o
        // next-auth quebrar a rota inteira de autenticação em qualquer ambiente
        // que ainda não tivesse o segredo — inclusive o de desenvolvimento.
        ...(googleConfigurado
            ? [GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            })]
            : []),
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                username: { label: 'E-mail ou usuário', type: 'text' },
                password: { label: 'Senha', type: 'password' },
            },
            authorize: authorizeCredentials,
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider !== 'google') return true
            // account.id_token é o que o WP consegue verificar contra a Google.
            // Sem ele não há como provar a identidade no servidor, e login que
            // não se prova não vira sessão.
            const idToken = typeof account.id_token === 'string' ? account.id_token : ''
            if (!idToken) return false
            const wp = await trocarGooglePorSessaoWp(idToken)
            if (!wp) return false
            // Enriquece o objeto que o callback jwt recebe logo em seguida.
            user.id = String(wp.userId)
            user.token = wp.token
            user.bio = wp.bio ?? ''
            user.roles = wp.roles ?? []
            user.name = wp.name ?? user.name
            user.image = wp.avatar ?? user.image
            return true
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.token = user.token
                token.bio = user.bio
                token.roles = user.roles
                token.picture = user.image ?? token.picture
            }
            return token
        },
        async session({ session, token }) {
            session.user.id = token.id
            session.user.bio = token.bio
            session.user.roles = token.roles
            return session
        },
    },
}
