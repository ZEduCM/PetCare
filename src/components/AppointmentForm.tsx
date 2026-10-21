'use client'

import { ArrowLeft, Save } from 'lucide-react'
import { useEffect, useState, type ChangeEvent, type SubmitEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppShell from './AppShell'
import { backLink, card, errorBanner, eyebrow, fieldError, fieldInput, fieldLabel, primaryButton, secondaryButton } from './ui'
import { api, errorMessage } from '../services/api'
import type { AppointmentInput, Pet } from '@/entities'

type FormErrors = Partial<Record<keyof AppointmentInput, string>>

const initial: AppointmentInput = {
  title: '',
  petId: '',
  category: '',
  date: '',
  time: '',
  notes: ''
}

export default function AppointmentForm({ id }: { id?: string }) {
  const router = useRouter()
  const editing = Boolean(id)
  const [form, setForm] = useState(initial)
  const [pets, setPets] = useState<Pet[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.getPets()
      .then(setPets)
      .catch(err => setApiError(errorMessage(err)))
  }, [])

  useEffect(() => {
    if (!id) return
    api.getAppointments()
      .then(data => {
        const item = data.find(current => String(current.id) === String(id))
        if (item) setForm({ title: item.title || '', petId: item.petId, category: item.category || '', date: item.date || '', time: item.time || '', notes: item.notes || '', completed: item.completed })
      })
      .catch(err => setApiError(errorMessage(err)))
  }, [id])

  function change(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
    setErrors(current => ({ ...current, [name]: '' }))
  }

  function validate() {
    const next: FormErrors = {}
    if (!form.title.trim()) next.title = 'Informe o nome do compromisso.'
    if (!form.petId) next.petId = 'Selecione um pet.'
    if (!form.category) next.category = 'Selecione uma categoria.'
    if (!form.date) next.date = 'Informe a data.'
    if (!form.time) next.time = 'Informe o horário.'
    if (form.title.trim().length > 0 && form.title.trim().length < 3) next.title = 'Use pelo menos 3 caracteres.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setApiError('')
    if (!validate()) return

    try {
      setSaving(true)
      if (id) {
        await api.updateAppointment(id, form)
      } else {
        await api.createAppointment(form)
      }
      router.push('/dashboard')
    } catch (err) {
      setApiError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <Link className={backLink} href="/dashboard"><ArrowLeft size={18} /> Voltar para o painel</Link>
      <section className={`${card} mx-auto max-w-[850px]`}>
        <div className="mb-[25px]">
          <p className={eyebrow}>{editing ? 'EDITAR' : 'NOVO'}</p>
          <h1>{editing ? 'Editar compromisso' : 'Novo compromisso'}</h1>
          <p className="text-muted">Preencha os dados para organizar a rotina do seu pet.</p>
        </div>

        {apiError && <div className={errorBanner} role="alert">{apiError}</div>}

        <form onSubmit={submit} noValidate>
          <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2">
            <div className="min-w-0 md:col-span-2">
              <label className={fieldLabel} htmlFor="title">Nome do compromisso <span className="text-danger">*</span></label>
              <input className={fieldInput} id="title" name="title" value={form.title} onChange={change} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'title-error' : undefined} placeholder="Ex.: Banho do Thor" />
              {errors.title && <small id="title-error" className={fieldError}>{errors.title}</small>}
            </div>

            <div className="min-w-0">
              <label className={fieldLabel} htmlFor="petId">Pet <span className="text-danger">*</span></label>
              <select className={fieldInput} id="petId" name="petId" value={form.petId} onChange={change} aria-invalid={Boolean(errors.petId)} aria-describedby={errors.petId ? 'petId-error' : undefined}>
                <option value="">Selecione</option>
                {pets.map(pet => <option key={pet.id} value={pet.id}>{pet.icon} {pet.name}</option>)}
              </select>
              {errors.petId && <small id="petId-error" className={fieldError}>{errors.petId}</small>}
            </div>

            <div className="min-w-0">
              <label className={fieldLabel} htmlFor="category">Categoria <span className="text-danger">*</span></label>
              <select className={fieldInput} id="category" name="category" value={form.category} onChange={change} aria-invalid={Boolean(errors.category)} aria-describedby={errors.category ? 'category-error' : undefined}>
                <option value="">Selecione</option>
                <option>Alimentação</option>
                <option>Rotina</option>
                <option>Higiene</option>
                <option>Saúde</option>
              </select>
              {errors.category && <small id="category-error" className={fieldError}>{errors.category}</small>}
            </div>

            <div className="min-w-0">
              <label className={fieldLabel} htmlFor="date">Data <span className="text-danger">*</span></label>
              <input className={fieldInput} id="date" name="date" type="date" value={form.date} onChange={change} aria-invalid={Boolean(errors.date)} aria-describedby={errors.date ? 'date-error' : undefined} />
              {errors.date && <small id="date-error" className={fieldError}>{errors.date}</small>}
            </div>

            <div className="min-w-0">
              <label className={fieldLabel} htmlFor="time">Horário <span className="text-danger">*</span></label>
              <input className={fieldInput} id="time" name="time" type="time" value={form.time} onChange={change} aria-invalid={Boolean(errors.time)} aria-describedby={errors.time ? 'time-error' : undefined} />
              {errors.time && <small id="time-error" className={fieldError}>{errors.time}</small>}
            </div>

            <div className="min-w-0 md:col-span-2">
              <label className={fieldLabel} htmlFor="notes">Observações</label>
              <textarea className={`${fieldInput} resize-y`} id="notes" name="notes" value={form.notes} onChange={change} rows={4} placeholder="Algum cuidado ou informação importante?" />
            </div>
          </div>

          <p className="my-[17px] text-[.85rem] text-muted">* Campos obrigatórios</p>
          <div className="flex flex-col-reverse gap-[9px] border-t border-line pt-5 md:flex-row md:justify-end">
            <Link className={`${secondaryButton} w-full md:w-auto`} href="/dashboard">Cancelar</Link>
            <button className={`${primaryButton} w-full md:w-auto`} type="submit" disabled={saving}>
              <Save size={18} /> {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Salvar compromisso'}
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  )
}
