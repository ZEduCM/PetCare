import { RefreshCw } from 'lucide-react'
import { errorBanner } from './ui'

export default function ErrorBanner({ message, onRetry }: { message: string, onRetry?: () => void }) {
  return (
    <div className={errorBanner} role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="inline-flex shrink-0 items-center gap-1.5 font-extrabold" onClick={onRetry}>
          <RefreshCw size={16} aria-hidden="true" />
          Tentar novamente
        </button>
      )}
    </div>
  )
}
