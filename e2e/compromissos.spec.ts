import { expect, test } from "@playwright/test";
import {
  appointmentCard,
  createAppointmentViaApi,
  createPetViaApi,
  fillAppointmentForm,
  mel,
  melVaccine,
  openNewAppointment,
  signInAsNewTutor,
} from "./support";

test.describe("Compromissos", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsNewTutor(page);
  });

  test("CT-13 — criar compromisso válido", { tag: ["@cenario", "@RF-03", "@RF-05"] }, async ({ page }) => {
    await createPetViaApi(page, mel);
    await openNewAppointment(page);
    await fillAppointmentForm(page, "Mel");
    await page.getByRole("button", { name: "Salvar compromisso" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    const card = appointmentCard(page, melVaccine.title);
    await expect(card).toContainText("Mel · Saúde");
    await expect(card).toContainText("10/04/2030");
    await expect(card).toContainText("09:00");
  });

  test("CT-14 — compromisso inválido", { tag: ["@cenario", "@RF-03", "@RF-04"] }, async ({ page }) => {
    await createPetViaApi(page, mel);
    const cases = [
      { step: "(a) título com 2 caracteres", pet: "Mel", data: { ...melVaccine, title: "Va" }, message: "Use pelo menos 3 caracteres." },
      { step: "(b) sem pet", pet: "", data: melVaccine, message: "Selecione um pet." },
      { step: "(c) sem categoria", pet: "Mel", data: { ...melVaccine, category: "" }, message: "Selecione uma categoria." },
      { step: "(d) sem data", pet: "Mel", data: { ...melVaccine, date: "" }, message: "Informe a data." },
      { step: "(e) sem horário", pet: "Mel", data: { ...melVaccine, time: "" }, message: "Informe o horário." },
    ];

    for (const item of cases) {
      await test.step(item.step, async () => {
        await page.goto("/compromissos/novo");
        await fillAppointmentForm(page, item.pet, item.data);
        await page.getByRole("button", { name: "Salvar compromisso" }).click();

        await expect(page.getByText(item.message)).toBeVisible();
        await expect(page).toHaveURL(/\/compromissos\/novo$/);
      });
    }

    expect(await (await page.request.get("/api/appointments")).json()).toEqual([]);
  });

  test("CT-15 — editar compromisso", { tag: ["@cenario", "@RF-03", "@RF-05"] }, async ({ page }) => {
    const pet = await createPetViaApi(page, mel);
    await createAppointmentViaApi(page, pet.id);
    await page.reload();

    await appointmentCard(page, melVaccine.title).getByRole("button", { name: `Editar ${melVaccine.title}` }).click();

    await expect(page.getByRole("heading", { name: "Editar compromisso" })).toBeVisible();
    await expect(page.getByLabel("Nome do compromisso")).toHaveValue(melVaccine.title);
    await expect(page.getByLabel("Pet *")).toHaveValue(pet.id);
    await expect(page.getByLabel("Categoria")).toHaveValue(melVaccine.category);
    await expect(page.getByLabel("Data")).toHaveValue(melVaccine.date);
    await expect(page.getByLabel("Horário")).toHaveValue(melVaccine.time);

    await page.getByLabel("Nome do compromisso").fill("Vacina V10 da Mel");
    await page.getByRole("button", { name: "Salvar alterações" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(appointmentCard(page, "Vacina V10 da Mel")).toBeVisible();
  });

  test("CT-16 — excluir compromisso", { tag: ["@cenario", "@RF-03", "@RF-05"] }, async ({ page }) => {
    const pet = await createPetViaApi(page, mel);
    await createAppointmentViaApi(page, pet.id);
    await page.reload();
    const card = appointmentCard(page, melVaccine.title);
    const confirm = page.getByRole("alertdialog", { name: "Excluir compromisso" });

    await card.getByRole("button", { name: `Excluir ${melVaccine.title}` }).click();
    await confirm.getByRole("button", { name: "Cancelar" }).click();
    await expect(confirm).toBeHidden();
    await expect(card).toBeVisible();

    await card.getByRole("button", { name: `Excluir ${melVaccine.title}` }).click();
    await confirm.getByRole("button", { name: "Excluir" }).click();
    await expect(card).toHaveCount(0);
  });
});
