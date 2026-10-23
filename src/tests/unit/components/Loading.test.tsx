import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import ErrorBanner from '@/components/ErrorBanner'
import Loading from '@/components/Loading'

let container: HTMLDivElement
let root: Root

function render(element: ReactNode) {
  act(() => root.render(element))
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.body.appendChild(document.createElement('div'))
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('Loading', { tags: ['RF-06', 'RF-07'] }, () => {
  test('anuncia o carregamento para leitores de tela', () => {
    render(<Loading label="Carregando compromissos" />)

    const status = container.querySelector('[role="status"]')

    expect(status?.textContent).toBe('Carregando compromissos')
  })
})

describe('ErrorBanner', { tags: ['RF-06'] }, () => {
  test('mostra a mensagem como alerta', () => {
    render(<ErrorBanner message="Não foi possível conectar." />)

    expect(container.querySelector('[role="alert"]')?.textContent).toBe('Não foi possível conectar.')
    expect(container.querySelector('button')).toBeNull()
  })

  test('oferece tentar novamente quando há como refazer a busca', () => {
    const onRetry = vi.fn()
    render(<ErrorBanner message="Falhou." onRetry={onRetry} />)

    const button = container.querySelector('button')
    act(() => button!.click())

    expect(button?.textContent).toContain('Tentar novamente')
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
