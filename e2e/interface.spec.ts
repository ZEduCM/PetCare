import { expect, test } from "@playwright/test";
import {
  createAppointmentViaApi,
  createPetViaApi,
  mel,
  melVaccine,
  signInAsNewTutor,
} from "./support";

const categories = [
  "Todos",
  "Alimentação",
  "Rotina",
  "Higiene",
  "Saúde",
];

test.describe("Interface, erros e sessão", () => {
  test(
    "CT-17 — filtros do painel",
    { tag: ["@cenario", "@RF-03", "@RF-07"] },
    async ({ page }) => {
      await signInAsNewTutor(page);

      const pet = await createPetViaApi(page, mel);

      const fixtures = [
        {
          ...melVaccine,
          title: "Consulta alimentar CT17",
          category: "Alimentação",
        },
        {
          ...melVaccine,
          title: "Rotina CT17",
          category: "Rotina",
        },
        {
          ...melVaccine,
          title: "Higiene CT17",
          category: "Higiene",
        },
        {
          ...melVaccine,
          title: "Saúde CT17",
          category: "Saúde",
        },
      ];

      for (const fixture of fixtures) {
        await createAppointmentViaApi(page, pet.id, fixture);
      }

      await page.reload();

      const filterGroup = page.getByLabel(
        "Filtrar compromissos",
      );

      for (const category of categories) {
        const button = filterGroup.getByRole("button", {
          name: category,
          exact: true,
        });

        await button.click();

        await expect(button).toHaveAttribute(
          "aria-pressed",
          "true",
        );

        for (const fixture of fixtures) {
          const shouldBeVisible =
            category === "Todos" ||
            fixture.category === category;

          const appointment = page.getByText(
            fixture.title,
            { exact: true },
          );

          if (shouldBeVisible) {
            await expect(appointment).toBeVisible();
          } else {
            await expect(appointment).toHaveCount(0);
          }
        }
      }
    },
  );
});