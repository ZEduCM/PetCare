import { expect, type APIRequestContext, type Page } from "@playwright/test";

export interface Tutor {
  name: string;
  email: string;
  password: string;
}

export const demo: Tutor = { name: "Tutor Demo", email: "demo@petcare.com", password: "petcare123" };

export const mel = {
  name: "Mel",
  type: "Cachorro",
  breed: "Poodle",
  age: "4",
  weight: "6.5",
  vaccine: "2030-03-15",
  description: "Teste manual",
};

export const melVaccine = {
  title: "Vacina da Mel",
  category: "Saúde",
  date: "2030-04-10",
  time: "09:00",
  notes: "Teste manual",
};

export function newTutor(name = "Ana Teste"): Tutor {
  const id = `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  return { name, email: `ana.teste.${id}@email.com`, password: "senha1234" };
}

export async function registerViaApi(request: APIRequestContext, tutor = newTutor()) {
  const response = await request.post("/api/auth/register", { data: tutor });
  expect(response.status()).toBe(201);
  return tutor;
}

export async function signIn(page: Page, tutor: Pick<Tutor, "email" | "password">) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(tutor.email);
  await page.getByLabel("Senha", { exact: true }).fill(tutor.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Meu painel" })).toBeVisible();
}

export async function signInAsNewTutor(page: Page) {
  const tutor = await registerViaApi(page.request);
  await signIn(page, tutor);
  return tutor;
}

export async function signOut(page: Page) {
  const menu = page.getByRole("button", { name: "Abrir menu" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

export async function createPetViaApi(page: Page, data: Record<string, string> = mel) {
  const response = await page.request.post("/api/pets", { data });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string; name: string };
}

export async function createAppointmentViaApi(page: Page, petId: string, data: Record<string, string> = melVaccine) {
  const response = await page.request.post("/api/appointments", { data: { ...data, petId } });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string; title: string };
}

export function petCards(page: Page) {
  return page.locator('main a[href^="/pets/"] strong');
}

export function appointmentCard(page: Page, title: string) {
  return page.getByRole("article").filter({ hasText: title });
}

export async function fillPetForm(page: Page, data: typeof mel = mel) {
  const dialog = page.getByRole("dialog", { name: "Cadastrar novo pet" });
  await dialog.getByLabel("Nome *").fill(data.name);
  await dialog.getByLabel("Tipo *").selectOption(data.type);
  await dialog.getByLabel("Raça *").fill(data.breed);
  await dialog.getByLabel("Idade *").fill(data.age);
  await dialog.getByLabel("Peso (kg) *").fill(data.weight);
  await dialog.getByLabel("Próxima vacina").fill(data.vaccine);
  await dialog.getByLabel("Observações").fill(data.description);
  return dialog;
}

export async function openNewAppointment(page: Page) {
  const menu = page.getByRole("button", { name: "Abrir menu" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("link", { name: "Novo compromisso" }).click();
  await expect(page.getByRole("heading", { name: "Novo compromisso" })).toBeVisible();
}

export async function fillAppointmentForm(page: Page, petName: string, data: typeof melVaccine = melVaccine) {
  await page.getByLabel("Nome do compromisso").fill(data.title);
  if (petName) await page.getByLabel("Pet *").selectOption({ label: `🐾 ${petName}` });
  if (data.category) await page.getByLabel("Categoria").selectOption(data.category);
  await page.getByLabel("Data").fill(data.date);
  await page.getByLabel("Horário").fill(data.time);
  await page.getByLabel("Observações").fill(data.notes);
}
