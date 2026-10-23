import { expect, test } from "@playwright/test";
import {
    createAppointmentViaApi,
    createPetViaApi,
    mel,
    melVaccine,
    newTutor,
    registerViaApi,
    signIn,
    signInAsNewTutor,
    signOut,
} from "./support";

const categories = [
    "Todos",
    "Alimentação",
    "Rotina",
    "Higiene",
    "Saúde",
];

async function expectNoHorizontalOverflow(
    page: import("@playwright/test").Page,
) {
    const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
    }));

    expect(
        dimensions.content,
        `Rolagem horizontal: ${JSON.stringify(dimensions)}`,
    ).toBeLessThanOrEqual(dimensions.viewport);
}

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

    test(
        "CT-18 — acessibilidade do modal de pet",
        { tag: ["@cenario", "@RF-07"] },
        async ({ page }) => {
            await signInAsNewTutor(page);

            const opener = page.getByRole("button", {
                name: /Cadastrar pet/,
            });

            await opener.focus();
            await page.keyboard.press("Enter");

            const dialog = page.getByRole("dialog", {
                name: "Cadastrar novo pet",
            });

            await expect(dialog).toBeVisible();

            await expect(
                dialog.getByLabel("Nome *"),
            ).toBeFocused();

            for (let i = 0; i < 12; i++) {
                await page.keyboard.press("Tab");

                const focoDentroDoModal = await dialog.evaluate((element) =>
                    element.contains(document.activeElement),
                );

                expect(
                    focoDentroDoModal,
                    `O foco saiu do modal após ${i + 1} pressionamento(s) de Tab`,
                ).toBe(true);
            }

            await page.keyboard.press("Escape");

            await expect(dialog).toBeHidden();
            await expect(opener).toBeFocused();
        },
    );

    test(
        "CT-19 — responsividade em login, painel, modal e compromisso",
        { tag: ["@cenario", "@RF-08"] },
        async ({ page }) => {
            for (const width of [360, 768, 1280]) {
                await test.step(`Viewport ${width}px`, async () => {
                    await page.setViewportSize({
                        width,
                        height: 900,
                    });

                    const tutor = newTutor(
                        `Responsividade CT19 ${width}`,
                    );

                    await registerViaApi(page.request, tutor);

                    await page.goto("/login");
                    await expectNoHorizontalOverflow(page);

                    await signIn(page, tutor);
                    await expectNoHorizontalOverflow(page);

                    const opener = page.getByRole("button", {
                        name: /Cadastrar pet/,
                    });

                    await expect(opener).toBeVisible();
                    await opener.click();

                    const dialog = page.getByRole("dialog", {
                        name: "Cadastrar novo pet",
                    });

                    await expect(dialog).toBeVisible();

                    await expect(
                        dialog.getByRole("button", {
                            name: "Salvar pet",
                        }),
                    ).toBeVisible();

                    await expectNoHorizontalOverflow(page);

                    await page.keyboard.press("Escape");

                    await page.goto("/compromissos/novo");

                    await expect(
                        page.getByRole("heading", {
                            name: "Novo compromisso",
                        }),
                    ).toBeVisible();

                    await expect(
                        page.getByRole("button", {
                            name: "Salvar compromisso",
                        }),
                    ).toBeVisible();

                    await expectNoHorizontalOverflow(page);
                });
            }
        },
    );

    test(
        "CT-20 — erro de rede apresenta mensagem em português",
        {
            tag: ["@cenario", "@RF-06"],
            annotation: {
                type: "defeito",
                description:
                    "OBS-01 — fetch offline mostra 'Failed to fetch'",
            },
        },
        async ({ page, context }) => {
            await signInAsNewTutor(page);

            await page.getByRole("button", {
                name: /Cadastrar pet/,
            }).click();

            const dialog = page.getByRole("dialog", {
                name: "Cadastrar novo pet",
            });

            await dialog.getByLabel("Nome *").fill(
                "Pet offline CT20",
            );

            await dialog.getByLabel("Raça *").fill("SRD");

            await dialog.getByLabel("Idade *").fill("2");

            await dialog.getByLabel("Peso (kg) *").fill("4.5");

            await context.setOffline(true);

            try {
                await dialog.getByRole("button", {
                    name: "Salvar pet",
                }).click();

                const alert = dialog.getByRole("alert");

                await expect(alert).toBeVisible();

                await expect(alert).not.toContainText(
                    "Failed to fetch",
                );

                await expect(alert).toContainText(
                    /internet|conectar|conexão/i,
                );
            } finally {
                await context.setOffline(false);
            }
        },
    );

    test("CT-21a — logout e acesso direto ao painel exigem login", {
        tag: ["@cenario", "@RF-01", "@RF-09"],
    }, async ({ page }) => {
        await signInAsNewTutor(page);

        await signOut(page);

        await expect(page).toHaveURL(/\/login$/);

        await page.goto("/dashboard");

        await expect(page).toHaveURL(/\/login$/);
        await expect(
            page.getByRole("heading", { name: "Bem-vindo ao PetCare" }),
        ).toBeVisible();
    });

    test(
        "CT-21b — botão Voltar após logout leva ao login",
        {
            tag: ["@cenario", "@RF-01", "@RF-09"],
            annotation: {
                type: "defeito",
                description:
                    "DEF-15 — o botão Voltar pode reapresentar o dashboard em cache",
            },
        },
        async ({ page }) => {
            await signInAsNewTutor(page);

            await page.goto("/compromissos/novo");

            await signOut(page);

            await expect(page).toHaveURL(/\/login$/);

            await page.goBack();

            await expect(page).toHaveURL(/\/login$/);

            await expect(
                page.getByRole("heading", {
                    name: "Bem-vindo ao PetCare",
                }),
            ).toBeVisible();
        },
    );

    test(
        "CT-22 — rota inexistente mostra página 404",
        {
            tag: ["@cenario", "@RF-09"],
            annotation: {
                type: "defeito",
                description:
                    "DEF-14 — rota desconhecida redireciona para /login",
            },
        },
        async ({ page }) => {

            await page.goto("/pagina-que-nao-existe");

            await expect(
                page.getByRole("heading", {
                    name: /página não encontrada|não encontrado/i,
                }),
            ).toBeVisible();

            await expect(page).not.toHaveURL(/\/login$/);

            await expect(
                page.getByText(/internal server error|stack trace/i),
            ).toHaveCount(0);
        },
    );
});