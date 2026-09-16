'use client'
import { ADMIN_EMAILS } from '@/lib/constants/identidade.mjs'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Tv, Plus, Pencil, BarChart2 } from 'lucide-react'
import { useWpEdit } from '@/components/ui/WpEditContext'
import { SITE_URL, WORDPRESS_ADMIN_URL } from '@/lib/constants/site'

const ADMIN = new Set(ADMIN_EMAILS)

export function WpAdminBar() {
    const { data: session } = useSession()
    const { editUrl } = useWpEdit()
    const pathname = usePathname()

    if (!session?.user?.email || !ADMIN.has(session.user.email)) return null

    const siteKitUrl = `${WORDPRESS_ADMIN_URL}/admin.php?page=googlesitekit-dashboard&permaURL=${encodeURIComponent(SITE_URL + pathname)}`

    return (
        <div className="fixed top-0 left-0 right-0 z-9999 flex h-7 items-center gap-0 bg-[#1d2327] text-[11px] text-[#a7aaad] font-sans">
            <a
                href={WORDPRESS_ADMIN_URL}
                target="_blank"
                rel="noreferrer"
                className="flex h-full items-center gap-1.5 px-3 hover:bg-[#2c3338] hover:text-white transition-colors"
            >
                <LayoutDashboard size={12} />
                WP Admin
            </a>

            <a
                href={`${WORDPRESS_ADMIN_URL}/edit.php?post_type=post`}
                target="_blank"
                rel="noreferrer"
                className="flex h-full items-center gap-1.5 px-3 hover:bg-[#2c3338] hover:text-white transition-colors"
            >
                <FileText size={12} />
                Posts
            </a>

            <a
                href={`${WORDPRESS_ADMIN_URL}/edit.php?post_type=production`}
                target="_blank"
                rel="noreferrer"
                className="flex h-full items-center gap-1.5 px-3 hover:bg-[#2c3338] hover:text-white transition-colors"
            >
                <Tv size={12} />
                Produções
            </a>

            <a
                href={`${WORDPRESS_ADMIN_URL}/post-new.php`}
                target="_blank"
                rel="noreferrer"
                className="flex h-full items-center gap-1.5 px-3 hover:bg-[#2c3338] hover:text-white transition-colors"
            >
                <Plus size={12} />
                Novo post
            </a>

            {editUrl && (
                <a
                    href={editUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-full items-center gap-1.5 px-3 bg-[#2c3338] text-white hover:bg-[#3c4348] transition-colors border-l border-[#3c4348]"
                >
                    <Pencil size={11} />
                    Editar no WP
                </a>
            )}

            <a
                href={siteKitUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto flex h-full items-center gap-1.5 px-3 hover:bg-[#2c3338] hover:text-white transition-colors text-[#a7aaad]"
                title="Ver desempenho desta página no Site Kit"
            >
                <BarChart2 size={12} />
                Site Kit
            </a>

            <div className="flex h-full items-center px-3 text-[#72777c] border-l border-[#3c4348]">
                {session?.user.name}
            </div>
        </div>
    )
}
