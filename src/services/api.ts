import type {
  Appointment,
  AppointmentInput,
  Pet,
  User,
} from "@/types";

const DEFAULT_ERROR = "Não foi possível concluir a operação.";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : DEFAULT_ERROR;
}

async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = DEFAULT_ERROR;

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Resposta sem JSON.
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return null as T;

  return response.json();
}

export type PetInput = Omit<Pet, "id" | "vaccine"> & {
  vaccine?: string;
};

export const api = {
  register: (name: string, email: string, password: string) =>
    request<{ message: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<User>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<null>("/api/auth/logout", {
      method: "POST",
    }),

  getPets: () =>
    request<Pet[]>("/api/pets"),

  createPet: (data: PetInput) =>
    request<Pet>("/api/pets", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAppointments: () =>
    request<Appointment[]>("/api/appointments"),

  createAppointment: (data: AppointmentInput) =>
    request<Appointment>("/api/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateAppointment: (
    id: string,
    data: Partial<AppointmentInput>,
  ) =>
    request<Appointment>(`/api/appointments?id=${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteAppointment: (id: string) =>
    request<null>(`/api/appointments?id=${id}`, {
      method: "DELETE",
    }),
};