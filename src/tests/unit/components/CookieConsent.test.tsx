import Clarity from '@microsoft/clarity'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import CookieConsent from '@/components/CookieConsent'

vi.mock('@microsoft/clarity', () => ({
  default: { init: vi.fn(), consentV2: vi.fn() }
}))

let container: HTMLDivElement
let root: Root

function render(clarityProjectId?: string) {
  act(() => root.render(<CookieConsent clarityProjectId={clarityProjectId} />))
}

function click(label: string) {
  const button = [...container.querySelectorAll('button')].find((b) => b.textContent === label)
  act(() => button!.click())
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.body.appendChild(document.createElement('div'))
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  document.cookie = 'petcare_consent=; Max-Age=0; Path=/'
  vi.clearAllMocks()
})

describe('CookieConsent', () => {
  test('não mostra nada sem o ID do Clarity', () => {
    render()
    expect(container.innerHTML).toBe('')
  })

  test('mostra o aviso e só carrega o Clarity depois de aceitar', () => {
    render('abc123')
    expect(container.textContent).toContain('Sua privacidade')
    expect(Clarity.init).not.toHaveBeenCalled()

    click('Aceitar')

    expect(container.textContent).not.toContain('Sua privacidade')
    expect(document.cookie).toContain('petcare_consent=granted')
    expect(Clarity.init).toHaveBeenCalledWith('abc123')
    expect(Clarity.consentV2).toHaveBeenCalledWith({ ad_Storage: 'denied', analytics_Storage: 'granted' })
  })

  test('não carrega o Clarity ao recusar', () => {
    render('abc123')
    click('Recusar')

    expect(container.textContent).not.toContain('Sua privacidade')
    expect(document.cookie).toContain('petcare_consent=denied')
    expect(Clarity.init).not.toHaveBeenCalled()
  })

  test('respeita a escolha salva no cookie', () => {
    document.cookie = 'petcare_consent=granted; Path=/'
    render('abc123')

    expect(container.textContent).not.toContain('Sua privacidade')
    expect(Clarity.init).toHaveBeenCalledWith('abc123')
  })
})
