
import { expect, test } from "@playwright/test";
import {
  fillPetForm,
  mel,
  newTutor,
  petCards,
  signIn,
  signInAsNewTutor,
  signOut,
} from "./support";

test.describe("Pets", () => {
  test("CT-08 — cadastrar pet válido", { tag: ["@cenario", "@RF-02"] }, async ({ page }) => {
    await signInAsNewTutor(page);

    await page.getByRole("button", { name: /cadastrar pet/i }).click();
    await fillPetForm(page, mel);
    await page.getByRole("button", { name: /salvar pet/i }).click();

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(petCards(page).filter({ hasText: "Mel" })).toBeVisible();
  });

  test("CT-09 — campos obrigatórios vazios", { tag: ["@cenario", "@RF-02", "@RF-04"] }, async ({ page }) => {
    await signInAsNewTutor(page);

    const cases = [
      { label: "Nome *", field: "name" },
      { label: "Raça *", field: "breed" },
      { label: "Idade *", field: "age" },
      { label: "Peso (kg) *", field: "weight" },
    ] as const;

    await page.getByRole("button", { name: /cadastrar pet/i }).click();
    const dialog = page.getByRole("dialog", { name: "Cadastrar novo pet" });

    for (const item of cases) {
      await test.step(`Campo obrigatório: ${item.field}`, async () => {
        await fillPetForm(page, mel);
        await dialog.getByLabel(item.label).fill("");
        const input = dialog.getByLabel(item.label);

        expect(await input.evaluate((element: HTMLInputElement) => element.validity.valid)).toBe(false);
        await page.getByRole("button", { name: /salvar pet/i }).click();
        await expect(dialog).toBeVisible();
      });
    }

    expect(await (await page.request.get("/api/pets")).json()).toEqual([]);
  });

  test("CT-10 — valores-limite do formulário", { tag: ["@cenario", "@RF-02", "@RF-04"] }, async ({ page }) => {
    await signInAsNewTutor(page);

    await page.getByRole("button", { name: /cadastrar pet/i }).click();
    const dialog = page.getByRole("dialog", { name: "Cadastrar novo pet" });
    await fillPetForm(page, mel);

    const age = dialog.getByLabel("Idade *");
    const weight = dialog.getByLabel("Peso (kg) *");
    const name = dialog.getByLabel("Nome *");
    const breed = dialog.getByLabel("Raça *");

    for (const value of ["0", "100"]) {
      await age.fill(value);
      expect(await age.evaluate((element: HTMLInputElement) => element.validity.valid)).toBe(true);
    }

    for (const value of ["101", "-1"]) {
      await age.fill(value);
      expect(await age.evaluate((element: HTMLInputElement) => element.validity.valid)).toBe(false);
    }

    for (const value of ["0.1", "1000"]) {
      await weight.fill(value);
      expect(await weight.evaluate((element: HTMLInputElement) => element.validity.valid)).toBe(true);
    }

    for (const value of ["0", "1001"]) {
      await weight.fill(value);
      expect(await weight.evaluate((element: HTMLInputElement) => element.validity.valid)).toBe(false);
    }

    await name.fill("N".repeat(100));
    await breed.fill("R".repeat(100));
    expect(await name.inputValue()).toHaveLength(100);
    expect(await breed.inputValue()).toHaveLength(100);

    await name.fill("");
    await name.pressSequentially("N".repeat(101));
    await breed.fill("");
    await breed.pressSequentially("R".repeat(101));

    expect(await name.inputValue()).toHaveLength(100);
    expect(await breed.inputValue()).toHaveLength(100);
  });

  test("CT-11 — persistência dos dados", { tag: ["@cenario", "@RF-02"] }, async ({ page }) => {
    const tutor = await signInAsNewTutor(page);

    await page.getByRole("button", { name: /cadastrar pet/i }).click();
    await fillPetForm(page, mel);
    await page.getByRole("button", { name: /salvar pet/i }).click();
    await expect(petCards(page).filter({ hasText: "Mel" })).toBeVisible();

    await page.reload();
    await expect(petCards(page).filter({ hasText: "Mel" })).toBeVisible();

    await signOut(page);
    await signIn(page, tutor);
    await expect(petCards(page).filter({ hasText: "Mel" })).toBeVisible();
  });

  test("CT-12 — isolamento entre usuários", { tag: ["@cenario", "@RF-02", "@RF-09"] }, async ({ page }) => {
    const firstTutor = await signInAsNewTutor(page);

    await page.getByRole("button", { name: /cadastrar pet/i }).click();
    await fillPetForm(page, mel);
    await page.getByRole("button", { name: /salvar pet/i }).click();
    await expect(petCards(page).filter({ hasText: "Mel" })).toBeVisible();

    await signOut(page);

    const secondTutor = newTutor("Segundo Tutor");
    const response = await page.request.post("/api/auth/register", { data: secondTutor });
    expect(response.status()).toBe(201);

    await signIn(page, secondTutor);
    await expect(petCards(page).filter({ hasText: "Mel" })).toHaveCount(0);

    await signOut(page);
    await signIn(page, firstTutor);
    await expect(petCards(page).filter({ hasText: "Mel" })).toBeVisible();
  });
});
