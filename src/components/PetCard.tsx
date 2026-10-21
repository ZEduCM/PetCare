
import Link from 'next/link'
import type { Pet } from '@/types'

export default function PetCard({ pet }: { pet: Pet }) {
  const petIcon =
  pet.type === 'Cachorro'
    ? '🐶'
    : pet.type === 'Gato'
      ? '🐱'
      : pet.type === 'Ave'
        ? '🦜'
        : pet.type === 'Coelho'
          ? '🐰'
          : pet.icon || '🐾'

  return (
    <Link
      className="group flex items-center gap-3 rounded-[15px] border border-line bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#b9cec4] hover:shadow-[0_7px_22px_rgba(47,75,65,.07)]"
      href={`/pets/${pet.id}`}
    >
      <span
        className="grid size-[58px] shrink-0 place-items-center rounded-2xl bg-[#edf5ef] text-[2rem] transition group-hover:bg-[#e2efe6]"
        aria-hidden="true"
      >
        {petIcon}
      </span>

      <span className="min-w-0">
        <strong className="block truncate text-[#304b3e]">
          {pet.name}
        </strong>
        <small className="mt-1 block text-muted">
          {pet.type}
        </small>
      </span>
    </Link>
  )
}
