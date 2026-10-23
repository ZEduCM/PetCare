const sizes = {
  sm: 'size-4 border-2',
  lg: 'size-9 border-[3px]',
}

export default function Spinner({ size = 'sm' }: { size?: keyof typeof sizes }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 animate-spin rounded-full border-current border-t-transparent ${sizes[size]}`}
    />
  )
}
