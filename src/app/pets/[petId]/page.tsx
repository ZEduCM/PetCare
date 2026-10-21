import { ArrowLeft, CalendarDays, PawPrint, Weight } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import AppShell from '@/components/AppShell'
import { backLink, card, eyebrow } from '@/components/ui'
import { currentUser } from '@/main/current-user'
import { makeGetPet } from '@/main/factories/pets'

function Detail({ icon, label, value }: { icon: ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#f8faf9] p-[15px] text-primary-dark">
      {icon}
      <span>
        <small className="block text-muted">{label}</small>
        <strong className="mt-0.5 block text-ink">{value}</strong>
      </span>
    </div>
  )
}

export default async function PetProfile({ params }: PageProps<'/pets/[petId]'>) {
  const user = await currentUser()
  if (!user) redirect('/login')

  const { petId } = await params
  const pet = await makeGetPet().execute({ userId: user.id, id: petId })

  if (!pet) {
    return (
      <AppShell>
        <section className="py-20 text-center">
          <h1>Pet não encontrado</h1>
          <Link href="/dashboard">Voltar ao painel</Link>
        </section>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Link className={backLink} href="/dashboard"><ArrowLeft size={18} /> Voltar para o painel</Link>
      <section className={card}>
        <div className="flex flex-col items-start gap-5 border-b border-line pb-7 md:flex-row md:items-center">
          <div className="grid size-24 place-items-center rounded-[25px] bg-sand text-[3.2rem]" aria-hidden="true">{pet.icon}</div>
          <div>
            <p className={eyebrow}>PERFIL DO PET</p>
            <h1 className="mb-0.5">{pet.name}</h1>
            <p className="text-muted">{pet.type} · {pet.breed}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 py-7 md:grid-cols-3">
          <Detail icon={<PawPrint size={20} />} label="Idade" value={pet.age} />
          <Detail icon={<Weight size={20} />} label="Peso" value={pet.weight} />
          <Detail icon={<CalendarDays size={20} />} label="Próxima vacina" value={pet.vaccine} />
        </div>

        <div className="border-t border-line pt-[25px]">
          <h2>Sobre {pet.name}</h2>
          <p className="mb-4 leading-[1.7] text-muted">{pet.description}</p>
        </div>
      </section>
    </AppShell>
  )
}
