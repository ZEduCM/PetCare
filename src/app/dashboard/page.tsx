
'use client'

import { RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import AppointmentCard, { formatDate } from '@/components/AppointmentCard'
import PetCard from '@/components/PetCard'
import SummaryCard from '@/components/SummaryCard'
import Modal from '@/components/Modal'
import { errorBanner, secondaryButton } from '@/components/ui'
import { api, errorMessage } from '@/services/api'
import type { Appointment, Pet } from '@/entities'

const placeholder =
  'rounded-[14px] border border-dashed border-line bg-white p-[35px] text-center text-muted'

const emptyPetForm = {
  name: '',
  type: 'Cachorro',
  breed: '',
  age: '',
  weight: '',
  vaccine: '',
  icon: '🐾',
  description: '',
}

export default function Dashboard() {
  const router = useRouter()

  const [pets, setPets] = useState<Pet[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null)

  const [petModalOpen, setPetModalOpen] = useState(false)
  const [petSaving, setPetSaving] = useState(false)
  const [petForm, setPetForm] = useState(emptyPetForm)
  const [petError, setPetError] = useState('')

  const [filter, setFilter] = useState('Todos')
  const [selectedSummary, setSelectedSummary] = useState<string | null>(null)
  const [appointmentToDelete, setAppointmentToDelete] =
    useState<Appointment | null>(null)
  const [deleting, setDeleting] = useState(false)
  function loadDashboard() {
    return Promise.all([api.getPets(), api.getAppointments()])
      .then(([petsData, appointmentsData]) => {
        setPets(petsData)
        setAppointments(appointmentsData)
        setError('')
      })
      .catch(err => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }

  function retry() {
    setLoading(true)
    setError('')
    loadDashboard()
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const filtered = useMemo(() => {
    const result = filter === 'Todos'
      ? appointments
      : appointments.filter(item => item.category === filter)

    return [...result].sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date)

      if (dateComparison !== 0) return dateComparison

      return (a.time || '').localeCompare(b.time || '')
    })
  }, [appointments, filter])

  const summaryItems = [
    {
      icon: '🐾',
      label: 'Pets cadastrados',
      count: pets.length,
    },
    {
      icon: '🍽️',
      label: 'Refeições',
      count: appointments.filter(a => a.category === 'Alimentação').length,
    },
    {
      icon: '📅',
      label: 'Rotina',
      count: appointments.filter(a => a.category === 'Rotina').length,
    },
    {
      icon: '🛁',
      label: 'Banhos e higiene',
      count: appointments.filter(a => a.category === 'Higiene').length,
    },
    {
      icon: '💉',
      label: 'Saúde',
      count: appointments.filter(a => a.category === 'Saúde').length,
    },
  ].filter(item => item.count > 0)

  async function savePet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (petSaving) return

    setPetSaving(true)
    setPetError('')

    try {
      const newPet = await api.createPet({
        ...petForm,
        name: petForm.name.trim(),
        breed: petForm.breed.trim(),
        description: petForm.description.trim(),
      })

      setPets(current =>
        [...current, newPet].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      )

      setPetModalOpen(false)
      setPetForm({ ...emptyPetForm })
    } catch (err) {
      setPetError(errorMessage(err))
    } finally {
      setPetSaving(false)
    }
  }

  function askDelete(id: string) {
    const item = appointments.find(a => a.id === id)
    if (item) setAppointmentToDelete(item)
  }

  async function confirmDelete() {
    if (!appointmentToDelete || deleting) return

    setDeleting(true)
    try {
      await api.deleteAppointment(appointmentToDelete.id)
      setAppointments(current =>
        current.filter(item => item.id !== appointmentToDelete.id),
      )
      setAppointmentToDelete(null)
    } catch (err) {
      setError(errorMessage(err))
      setAppointmentToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  async function toggleComplete(item: Appointment) {
    try {
      const updated = await api.updateAppointment(item.id, {
        completed: !item.completed,
      })

      setAppointments(current =>
        current.map(currentItem =>
          currentItem.id === item.id ? updated : currentItem,
        ),
      )
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <AppShell>
      {/* Cabeçalho do painel */}
      <section className="mb-7">
        <h1 className="text-2xl font-bold text-primary-dark">
          Meu painel
        </h1>
        <p className="mt-1 text-sm text-muted">
          Acompanhe seus pets e organize os compromissos.
        </p>
      </section>

      {/* Cartões de resumo */}
      <section
        className={`mb-[38px] mt-[38px] grid grid-cols-1 gap-[15px] ${summaryItems.length > 4 ? 'md:grid-cols-3 lg:grid-cols-5' : 'md:grid-cols-4'}`}
        aria-label="Resumo"
      >
        {summaryItems.map(item => (
          <SummaryCard
            key={item.label}
            icon={item.icon}
            value={item.count}
            label={item.label}
            onClick={() => {
              setSelectedSummary(item.label)
            }}
          />
        ))}
      </section>

      {/* Cadastro e listagem dos pets: aparece apenas uma vez */}
      <section className="mt-[38px]">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2>Seus pets</h2>
            <p className="text-muted">
              Selecione um pet para ver seus detalhes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setPetError('')
              setPetModalOpen(true)
            }}
            className="self-start rounded-xl bg-primary px-5 py-3 font-bold text-white transition hover:opacity-90 sm:self-auto"
          >
            + Cadastrar pet
          </button>
        </div>

        {pets.length === 0 ? (
          <div className={placeholder}>
            Você ainda não cadastrou nenhum pet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-[15px] md:grid-cols-3">
            {pets.map(pet => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        )}
      </section>

      {error && (
        <div className={`${errorBanner} mb-5`} role="alert">
          <span>{error}</span>
          <button
            className="inline-flex items-center gap-1.5 font-extrabold"
            onClick={retry}
          >
            <RefreshCw size={16} />
            Tentar novamente
          </button>
        </div>
      )}

      {/* Próximos compromissos */}
      <section className="mt-[38px]">
        <div className="mb-4 flex flex-col items-stretch gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2>Próximos compromissos</h2>
            <p className="text-muted">
              Organize a rotina dos seus pets.
            </p>
          </div>

          <div
            className="flex flex-wrap justify-start gap-[5px] md:justify-end"
            aria-label="Filtrar compromissos"
          >
            {[
              'Todos',
              'Alimentação',
              'Rotina',
              'Higiene',
              'Saúde',
            ].map(option => (
              <button
                key={option}
                className={`rounded-[9px] border px-2.5 py-[7px] text-[.8rem] font-bold ${filter === option
                  ? 'border-[#bfd2c9] bg-primary-light text-primary-dark'
                  : 'border-line bg-white text-muted hover:border-[#bfd2c9] hover:bg-primary-light hover:text-primary-dark'
                  }`}
                aria-pressed={filter === option}
                onClick={() => setFilter(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={placeholder}>
            Carregando compromissos...
          </div>
        ) : filtered.length === 0 ? (
          <div className={placeholder}>
            Nenhum compromisso encontrado para este filtro.
          </div>
        ) : (
          <div className="grid gap-2.5">
            {filtered.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-light font-bold text-primary-dark">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <AppointmentCard
                    appointment={item}
                    onView={setSelectedAppointment}
                    onEdit={() =>
                      router.push(`/compromissos/${item.id}/editar`)
                    }
                    onDelete={askDelete}
                    onComplete={toggleComplete}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal de cadastro de pet */}
      <Modal
        open={petModalOpen}
        title="Cadastrar novo pet"
        onClose={() => {
          if (!petSaving) setPetModalOpen(false)
        }}
      >
        <form onSubmit={savePet} className="grid gap-4">
          <label className="grid gap-1">
            Nome *
            <input
              required
              maxLength={100}
              value={petForm.name}
              onChange={e =>
                setPetForm({ ...petForm, name: e.target.value })
              }
              className="rounded-lg border border-line p-3"
              placeholder="Nome do pet"
            />
          </label>

          <label className="grid gap-1">
            Tipo *
            <select
              required
              value={petForm.type}
              onChange={e =>
                setPetForm({ ...petForm, type: e.target.value })
              }
              className="rounded-lg border border-line p-3"
            >
              <option value="Cachorro">Cachorro</option>
              <option value="Gato">Gato</option>
              <option value="Ave">Ave</option>
              <option value="Outro">Outro</option>
            </select>
          </label>

          <label className="grid gap-1">
            Raça *
            <input
              required
              maxLength={100}
              value={petForm.breed}
              onChange={e =>
                setPetForm({ ...petForm, breed: e.target.value })
              }
              className="rounded-lg border border-line p-3"
              placeholder="Raça do pet"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              Idade *
              <input
                required
                type="number"
                min="0"
                max="100"
                step="1"
                value={petForm.age}
                onChange={e =>
                  setPetForm({ ...petForm, age: e.target.value })
                }
                className="min-w-0 rounded-lg border border-line p-3"
              />
            </label>

            <label className="grid gap-1">
              Peso (kg) *
              <input
                required
                type="number"
                min="0.1"
                max="1000"
                step="0.1"
                value={petForm.weight}
                onChange={e =>
                  setPetForm({ ...petForm, weight: e.target.value })
                }
                className="min-w-0 rounded-lg border border-line p-3"
              />
            </label>
          </div>

          <label className="grid gap-1">
            Próxima vacina
            <input
              type="date"
              value={petForm.vaccine}
              onChange={e =>
                setPetForm({ ...petForm, vaccine: e.target.value })
              }
              className="rounded-lg border border-line p-3"
            />
          </label>

          <label className="grid gap-1">
            Observações
            <textarea
              maxLength={1000}
              value={petForm.description}
              onChange={e =>
                setPetForm({ ...petForm, description: e.target.value })
              }
              className="rounded-lg border border-line p-3"
              rows={3}
              placeholder="Informações importantes sobre o pet"
            />
          </label>

          {petError && (
            <div className={errorBanner} role="alert">
              {petError}
            </div>
          )}

          <button
            type="submit"
            disabled={petSaving}
            className="rounded-xl bg-primary px-5 py-3 font-bold text-white disabled:opacity-60"
          >
            {petSaving ? 'Salvando...' : 'Salvar pet'}
          </button>
        </form>
      </Modal>

      {/* Modal de confirmação de exclusão */}
      <Modal
        open={appointmentToDelete !== null}
        title="Excluir compromisso"
        role="alertdialog"
        describedBy="delete-description"
        onClose={() => {
          if (!deleting) setAppointmentToDelete(null)
        }}
      >
        <p id="delete-description" className="text-muted">
          Deseja realmente excluir{' '}
          <strong className="text-ink">{appointmentToDelete?.title}</strong>
          {appointmentToDelete?.pet && <> de {appointmentToDelete.pet}</>}?
          Essa ação não pode ser desfeita.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className={secondaryButton}
            onClick={() => setAppointmentToDelete(null)}
            disabled={deleting}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-[11px] bg-danger px-[17px] py-[11px] font-extrabold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-65"
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </Modal>

      {/* Modal de detalhes do compromisso */}
      <Modal
        open={Boolean(selectedAppointment)}
        title="Detalhes do compromisso"
        onClose={() => setSelectedAppointment(null)}
      >
        {selectedAppointment && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-[18px] gap-y-2.5 [&_dt]:font-bold [&_dt]:text-muted">
            <dt>Compromisso</dt>
            <dd>{selectedAppointment.title}</dd>

            <dt>Pet</dt>
            <dd>{selectedAppointment.pet}</dd>

            <dt>Categoria</dt>
            <dd>{selectedAppointment.category}</dd>

            <dt>Data</dt>
            <dd>{formatDate(selectedAppointment.date)}</dd>

            <dt>Horário</dt>
            <dd>{selectedAppointment.time}</dd>

            <dt>Situação</dt>
            <dd>
              {selectedAppointment.completed ? 'Concluído' : 'Pendente'}
            </dd>

            <dt>Observações</dt>
            <dd>
              {selectedAppointment.notes || 'Nenhuma observação.'}
            </dd>
          </dl>
        )}
      </Modal>

      {/* Modal de resumo */}
      <Modal
        open={selectedSummary !== null}
        title={selectedSummary ?? 'Resumo'}
        onClose={() => setSelectedSummary(null)}
      >
        <div className="grid gap-3">
          {selectedSummary === 'Pets cadastrados' ? (
            pets.length === 0 ? (
              <p className="text-muted">Nenhum pet cadastrado.</p>
            ) : (
              pets.map(pet => (
                <div
                  key={pet.id}
                  className="rounded-xl border border-line p-4"
                >
                  <strong>{pet.name}</strong>
                  <p className="text-sm text-muted">
                    {pet.type} · {pet.breed}
                  </p>
                </div>
              ))
            )
          ) : (
            appointments
              .filter(item => {
                const categoryByLabel: Record<string, string> = {
                  Refeições: 'Alimentação',
                  Rotina: 'Rotina',
                  'Banhos e higiene': 'Higiene',
                  Saúde: 'Saúde',
                }

                return item.category === categoryByLabel[selectedSummary ?? '']
              })
              .sort((a, b) => {
                const dateComparison = a.date.localeCompare(b.date)
                if (dateComparison !== 0) return dateComparison
                return (a.time || '').localeCompare(b.time || '')
              })
              .map(item => (
                <div
                  key={item.id}
                  className="rounded-xl border border-line p-4"
                >
                  <strong>{item.title}</strong>
                  <p className="mt-1 text-sm text-muted">
                    Animal: {item.pet}
                  </p>
                  <p className="text-sm text-muted">
                    O que fazer: {item.title}
                  </p>
                  <p className="text-sm text-muted">
                    Data: {formatDate(item.date)} · Horário: {item.time || 'Não informado'}
                  </p>
                </div>
              ))
          )}
        </div>
      </Modal>
    </AppShell>
  )
}
