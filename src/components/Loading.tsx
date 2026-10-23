import Spinner from './Spinner'

export default function Loading({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center justify-center p-2 text-primary-dark">
      <Spinner size="lg" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
