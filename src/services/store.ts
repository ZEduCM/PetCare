import { useEffect, useSyncExternalStore } from "react";
import type { Appointment, AppointmentInput, Pet } from "@/types";
import { api, errorMessage, type PetInput } from "./api";

export interface StoreState {
  loaded: boolean;
  fetching: boolean;
  error: string;
  pets: Pet[];
  appointments: Appointment[];
}

const initialState: StoreState = {
  loaded: false,
  fetching: false,
  error: "",
  pets: [],
  appointments: [],
};

let state = initialState;
let inFlight: Promise<void> | null = null;
let session = 0;
let writes = 0;
const listeners = new Set<() => void>();

function setState(changes: Partial<StoreState>) {
  state = { ...state, ...changes };
  listeners.forEach((listener) => listener());
}

function write(changes: Partial<StoreState>) {
  writes += 1;
  setState(changes);
}

export function getState() {
  return state;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetStore() {
  session += 1;
  inFlight = null;
  setState(initialState);
}

export function refresh() {
  if (inFlight) return inFlight;
  setState({ fetching: true, error: "" });
  inFlight = fetchEverything({ session, writes }).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function fetchEverything(startedAt: { session: number; writes: number }) {
  const result = await fetchResult();
  if (startedAt.session !== session) return;
  if (startedAt.writes !== writes) {
    setState({ fetching: false });
    return;
  }
  setState({ ...result, fetching: false });
}

async function fetchResult(): Promise<Partial<StoreState>> {
  try {
    const [pets, appointments] = await Promise.all([
      api.getPets(),
      api.getAppointments(),
    ]);
    return { loaded: true, pets, appointments };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}

const byName = (a: Pet, b: Pet) => a.name.localeCompare(b.name);

export async function createPet(data: PetInput) {
  const pet = await api.createPet(data);
  write({ pets: [...state.pets, pet].sort(byName) });
  return pet;
}

export async function createAppointment(data: AppointmentInput) {
  const appointment = await api.createAppointment(data);
  write({ appointments: [...state.appointments, appointment] });
  return appointment;
}

export async function updateAppointment(
  id: string,
  changes: Partial<AppointmentInput>,
) {
  const updated = await api.updateAppointment(id, changes);
  write({
    appointments: state.appointments.map((item) =>
      item.id === id ? updated : item,
    ),
  });
  return updated;
}

export async function deleteAppointment(id: string) {
  await api.deleteAppointment(id);
  write({
    appointments: state.appointments.filter((item) => item.id !== id),
  });
}

export function usePetCareData() {
  const data = useSyncExternalStore(subscribe, getState, getState);

  useEffect(() => {
    refresh();
  }, []);

  return data;
}
