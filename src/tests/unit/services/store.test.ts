import { beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "@/services/api";
import {
  createAppointment,
  createPet,
  deleteAppointment,
  getState,
  refresh,
  resetStore,
  subscribe,
  updateAppointment,
} from "@/services/store";
import type { Appointment, Pet } from "@/types";

vi.mock("@/services/api", async () => {
  const actual = await vi.importActual<typeof import("@/services/api")>("@/services/api");
  return {
    ...actual,
    api: {
      getPets: vi.fn(),
      getAppointments: vi.fn(),
      createPet: vi.fn(),
      createAppointment: vi.fn(),
      updateAppointment: vi.fn(),
      deleteAppointment: vi.fn(),
    },
  };
});

const mocked = vi.mocked(api);

function pet(name: string): Pet {
  return {
    id: `pet-${name.toLowerCase()}`,
    name,
    type: "Gato",
    breed: "SRD",
    age: "2",
    weight: "3",
    vaccine: "",
    icon: "🐱",
    description: "",
  };
}

function appointment(id: string, title: string): Appointment {
  return {
    id,
    petId: "pet-luna",
    pet: "Luna",
    title,
    category: "Rotina",
    date: "2030-01-10",
    time: "08:00",
    notes: "",
    completed: false,
  };
}

const luna = pet("Luna");
const banho = appointment("apt-1", "Banho da Luna");

function serverHas(pets: Pet[], appointments: Appointment[]) {
  mocked.getPets.mockResolvedValue(pets);
  mocked.getAppointments.mockResolvedValue(appointments);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

beforeEach(() => {
  resetStore();
  vi.clearAllMocks();
});

describe("store", { tags: ["RF-02", "RF-03", "RF-06"] }, () => {
  test("a primeira busca sai do estado vazio para carregado", async () => {
    serverHas([luna], [banho]);

    const loading = refresh();
    expect(getState()).toMatchObject({ loaded: false, fetching: true });

    await loading;
    expect(getState()).toMatchObject({ loaded: true, fetching: false, pets: [luna], appointments: [banho] });
  });

  test("ao trocar de tela mantém os itens visíveis e atualiza quando a nova busca termina", async () => {
    serverHas([luna], [banho]);
    await refresh();
    const nextPets = deferred<Pet[]>();
    mocked.getPets.mockReturnValue(nextPets.promise);
    mocked.getAppointments.mockResolvedValue([]);

    const refreshing = refresh();
    expect(getState()).toMatchObject({ loaded: true, fetching: true, pets: [luna], appointments: [banho] });

    nextPets.resolve([luna, pet("Bob")]);
    await refreshing;
    expect(getState().pets.map((item) => item.name)).toEqual(["Luna", "Bob"]);
    expect(getState().appointments).toEqual([]);
    expect(mocked.getPets).toHaveBeenCalledTimes(2);
  });

  test("junta buscas simultâneas numa única chamada", async () => {
    serverHas([luna], []);

    await Promise.all([refresh(), refresh()]);

    expect(mocked.getPets).toHaveBeenCalledTimes(1);
  });

  test("uma falha guarda a mensagem, mantém os itens já carregados e permite tentar de novo", async () => {
    serverHas([luna], [banho]);
    await refresh();
    mocked.getPets.mockRejectedValueOnce(new Error("Não foi possível conectar."));

    await refresh();
    expect(getState()).toMatchObject({ error: "Não foi possível conectar.", loaded: true, pets: [luna] });

    serverHas([pet("Bob")], []);
    await refresh();
    expect(getState()).toMatchObject({ error: "", pets: [pet("Bob")] });
  });

  test("cadastrar pet entra no cache em ordem de nome", async () => {
    serverHas([luna], []);
    await refresh();
    const bob = pet("Bob");
    mocked.createPet.mockResolvedValue(bob);

    await createPet({ name: "Bob", type: "Gato", breed: "SRD", age: "2", weight: "3", icon: "🐱", description: "" });

    expect(getState().pets.map((item) => item.name)).toEqual(["Bob", "Luna"]);
  });

  test("criar, alterar e excluir compromisso atualizam o cache", async () => {
    serverHas([luna], [banho]);
    await refresh();
    const vacina = appointment("apt-2", "Vacina");
    mocked.createAppointment.mockResolvedValue(vacina);
    mocked.updateAppointment.mockResolvedValue({ ...vacina, completed: true });
    mocked.deleteAppointment.mockResolvedValue(null);

    await createAppointment({ petId: luna.id, title: "Vacina", category: "Saúde", date: "2030-01-10", time: "08:00", notes: "" });
    expect(getState().appointments).toEqual([banho, vacina]);

    await updateAppointment("apt-2", { completed: true });
    expect(getState().appointments[1].completed).toBe(true);

    await deleteAppointment("apt-1");
    expect(getState().appointments.map((item) => item.id)).toEqual(["apt-2"]);
  });

  test("uma busca antiga não sobrescreve uma alteração feita depois dela", async () => {
    serverHas([luna], [banho]);
    await refresh();
    const stale = deferred<Appointment[]>();
    mocked.getAppointments.mockReturnValue(stale.promise);
    mocked.updateAppointment.mockResolvedValue({ ...banho, completed: true });

    const refreshing = refresh();
    await updateAppointment("apt-1", { completed: true });
    stale.resolve([banho]);
    await refreshing;

    expect(getState().appointments[0].completed).toBe(true);
  });

  test("um erro ao salvar não altera o cache", async () => {
    serverHas([luna], [banho]);
    await refresh();
    mocked.deleteAppointment.mockRejectedValue(new Error("Falhou."));

    await expect(deleteAppointment("apt-1")).rejects.toThrow("Falhou.");

    expect(getState().appointments).toEqual([banho]);
  });

  test("resetStore descarta os dados da sessão anterior", async () => {
    serverHas([luna], [banho]);
    await refresh();

    resetStore();

    expect(getState()).toMatchObject({ loaded: false, fetching: false, pets: [], appointments: [] });
  });

  test("avisa quem assina a cada mudança e para depois de cancelar", async () => {
    serverHas([luna], []);
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    await refresh();
    const calls = listener.mock.calls.length;
    unsubscribe();
    await refresh();

    expect(calls).toBeGreaterThan(0);
    expect(listener).toHaveBeenCalledTimes(calls);
  });
});
