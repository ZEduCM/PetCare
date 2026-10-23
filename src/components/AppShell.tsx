
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CalendarPlus, Home, LogOut, Menu, PawPrint, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { api } from '@/services/api'
import { resetStore } from '@/services/store'

const navItem = 'flex items-center gap-[7px] rounded-[10px] p-3 font-bold md:py-[9px]'

function navLink(active: boolean) {
  return `${navItem} ${active ? 'bg-primary-light text-primary-dark' : 'text-muted hover:bg-primary-light hover:text-primary-dark'}`
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function checkAuthentication() {
      if (!localStorage.getItem('petcare_user')) {
        router.replace('/login')
      }
    }

    checkAuthentication()

    window.addEventListener('pageshow', checkAuthentication)
    window.addEventListener('popstate', checkAuthentication)

    return () => {
      window.removeEventListener('pageshow', checkAuthentication)
      window.removeEventListener('popstate', checkAuthentication)
    }
  }, [router])

  async function logout() {
    try {
      await api.logout()
    } finally {
      localStorage.removeItem('petcare_user')
      resetStore()
      window.location.replace('/login')
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white/95 px-[18px] py-3 backdrop-blur-[10px] md:px-[max(22px,calc((100vw_-_1160px)/2))] md:py-3.5">
        <Link
          className="flex items-center gap-2.5 text-xl font-extrabold text-primary-dark"
          href="/dashboard"
          aria-label="PetCare - página inicial"
        >
          <span className="grid size-10 place-items-center rounded-[13px] bg-primary-light">
            <PawPrint size={23} aria-hidden="true" />
          </span>
          <span>PetCare</span>
        </Link>

        <button
          className="grid place-items-center text-primary-dark md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>

        <nav
          className={`${open ? 'flex' : 'hidden'} absolute inset-x-3 top-[68px] flex-col gap-2 rounded-[14px] border border-line bg-white p-[9px] shadow-[0_12px_30px_rgba(0,0,0,.1)] md:static md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
          aria-label="Navegação principal"
        >
          <Link
            className={navLink(pathname === '/dashboard')}
            aria-current={pathname === '/dashboard' ? 'page' : undefined}
            href="/dashboard"
            onClick={() => setOpen(false)}
          >
            <Home size={18} aria-hidden="true" /> Início
          </Link>

          <Link
            className={navLink(pathname.includes('/compromissos'))}
            aria-current={pathname.includes('/compromissos') ? 'page' : undefined}
            href="/compromissos/novo"
            onClick={() => setOpen(false)}
          >
            <CalendarPlus size={18} aria-hidden="true" /> Novo compromisso
          </Link>

          <button
            className={`${navItem} text-muted hover:bg-[#f8eceb] hover:text-danger`}
            onClick={logout}
          >
            <LogOut size={18} aria-hidden="true" /> Sair
          </button>
        </nav>
      </header>

      <main className="mx-auto w-[min(100%_-_28px,600px)] pt-7 pb-[50px] md:w-[min(1160px,100%_-_40px)] md:pt-11 md:pb-[70px]">
        {children}
      </main>
    </div>
  )
}
