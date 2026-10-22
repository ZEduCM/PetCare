import { z } from "zod";
import { messages } from "@/messages";
import { requiredText } from "@/validators/fields";
import { ZodValidator } from "@/validators/zod-validator";
import type { Pet } from "./pet";

export interface AppointmentProps {
  id: string;
  petId: string;
  petName: string;
  title: string;
  category: string;
  date: string;
  time: string;
  notes: string;
  completed: boolean;
}

export type AppointmentData = Omit<
  AppointmentProps,
  "id" | "notes" | "completed"
> &
  Partial<Pick<AppointmentProps, "id" | "notes" | "completed">>;

export type AppointmentChanges = Partial<
  Pick<
    AppointmentProps,
    "title" | "category" | "date" | "time" | "notes" | "completed"
  > & { pet: Pet }
>;

export interface AppointmentJSON
  extends Omit<AppointmentProps, "petName"> {
  pet: string;
}

const validator = new ZodValidator(
  z.object({
    id: z.string().default(() => crypto.randomUUID()),
    petId: z.string(),
    petName: z.string(),
    title: requiredText(messages.requiredFields).pipe(
      z.string().min(3, messages.shortTitle),
    ),
    category: requiredText(messages.requiredFields).pipe(
      z.enum(["Alimentação", "Rotina", "Higiene", "Saúde"], {
        error: messages.invalidCategory,
      }),
    ),

    date: requiredText(messages.requiredFields).pipe(
      z.iso.date({ error: messages.invalidDate }),
    ),
    time: requiredText(messages.requiredFields).pipe(
      z.iso.time({ error: messages.invalidTime }),
    ),
    notes: z.string().trim().default(""),
    completed: z.boolean().default(false),
  }),
);

export class Appointment {
  private props: AppointmentProps;

  constructor(data: AppointmentData) {
    this.props = validator.validate(data);
  }

  get id() {
    return this.props.id;
  }

  get petId() {
    return this.props.petId;
  }

  get petName() {
    return this.props.petName;
  }

  get title() {
    return this.props.title;
  }

  get category() {
    return this.props.category;
  }

  get date() {
    return this.props.date;
  }

  get time() {
    return this.props.time;
  }

  get notes() {
    return this.props.notes;
  }

  get completed() {
    return this.props.completed;
  }

  update({ pet, ...changes }: AppointmentChanges) {
    this.props = validator.validate({
      id: this.id,
      petId: pet?.id ?? this.petId,
      petName: pet?.name ?? this.petName,
      title: changes.title ?? this.title,
      category: changes.category ?? this.category,
      date: changes.date ?? this.date,
      time: changes.time ?? this.time,
      notes: changes.notes ?? this.notes,
      completed: changes.completed ?? this.completed,
    });
  }

  toJSON(): AppointmentJSON {
    return {
      id: this.id,
      petId: this.petId,
      pet: this.petName,
      title: this.title,
      category: this.category,
      date: this.date,
      time: this.time,
      notes: this.notes,
      completed: this.completed,
    };
  }
}
