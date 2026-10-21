import { CalendarDays, Check, Clock3, Eye, Pencil, Trash2 } from 'lucide-react'
import type { Appointment } from '@/entities'

const categoryIcon: Record<string, string> = {
  Alimentação: '🍽️',
  Rotina: '🌙',
  Higiene: '🛁',
  Saúde: '💉'
}

const actionButton = 'grid size-[34px] place-items-center rounded-lg text-muted hover:bg-primary-light hover:text-primary-dark'

interface AppointmentCardProps {
  appointment: Appointment
  onView: (appointment: Appointment) => void
  onEdit: (appointment: Appointment) => void
  onDelete: (id: string) => void
  onComplete: (appointment: Appointment) => void
}

export default function AppointmentCard({ appointment, onView, onEdit, onDelete, onComplete }: AppointmentCardProps) {
  return (
    <article className={`grid grid-cols-[auto_1fr] items-center gap-3.5 rounded-[14px] border border-line bg-white px-[17px] py-[15px] md:grid-cols-[auto_1fr_auto] ${appointment.completed ? 'opacity-[.62]' : ''}`}>
      <div className="grid size-[43px] place-items-center rounded-xl bg-cream text-[1.2rem]" aria-hidden="true">
        {categoryIcon[appointment.category] || '🐾'}
      </div>
      <div>
        <strong className={`block ${appointment.completed ? 'line-through' : ''}`}>{appointment.title}</strong>
        <span className="block text-[.88rem] text-muted">{appointment.pet} · {appointment.category}</span>
        <small className="mt-[5px] flex items-center gap-[5px] text-muted"><CalendarDays size={14} aria-hidden="true" /> {formatDate(appointment.date)} <Clock3 size={14} aria-hidden="true" /> {appointment.time}</small>
      </div>
      <div className="col-start-2 flex justify-end gap-[3px] md:col-auto md:justify-start">
        <button className={actionButton} onClick={() => onView(appointment)} aria-label={`Ver detalhes de ${appointment.title}`} title="Ver detalhes">
          <Eye size={17} />
        </button>
        <button className={actionButton} onClick={() => onComplete(appointment)} aria-label={appointment.completed ? 'Marcar como pendente' : 'Marcar como concluído'} title={appointment.completed ? 'Marcar como pendente' : 'Concluir'}>
          <Check size={17} />
        </button>
        <button className={actionButton} onClick={() => onEdit(appointment)} aria-label={`Editar ${appointment.title}`} title="Editar">
          <Pencil size={17} />
        </button>
        <button className={actionButton} onClick={() => onDelete(appointment.id)} aria-label={`Excluir ${appointment.title}`} title="Excluir">
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  )
}

export function formatDate(value: string) {
  if (!value) return ''
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')
}
