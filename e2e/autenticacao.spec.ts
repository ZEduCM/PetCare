import { expect, test } from "@playwright/test";
import { demo, newTutor, signIn } from "./support";

test.describe("Autenticação", () => {
  test("CT-01 — login válido", { tag: ["@cenario", "@RF-01"] }, async ({ page }) => {
    await signIn(page, demo);

    for (const pet of ["Mimi", "Nina", "Thor"]) {
      await expect(page.getByRole("link", { name: new RegExp(pet) })).toBeVisible();
    }
  });

  test("CT-02 — login com senha incorreta", { tag: ["@cenario", "@RF-01"] }, async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(demo.email);
    await page.getByLabel("Senha", { exact: true }).fill("errada123");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("main").getByRole("alert")).toHaveText("E-mail ou senha inválidos.");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("CT-03 — login com campos vazios", { tag: ["@cenario", "@RF-01", "@RF-04"] }, async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Informe e-mail e senha para continuar.");
  });

  test("CT-04 — cadastro de usuário válido", { tag: ["@cenario", "@RF-01"] }, async ({ page }) => {
    const tutor = newTutor();

    await page.goto("/cadastro");
    await page.getByLabel("Nome completo").fill(tutor.name);
    await page.getByLabel("E-mail").fill(tutor.email);
    await page.getByLabel("Senha", { exact: true }).fill(tutor.password);
    await page.getByLabel("Confirmar senha").fill(tutor.password);
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByRole("main").getByRole("status")).toContainText("Usuário cadastrado com sucesso!");
    for (const label of ["Nome completo", "E-mail", "Confirmar senha"]) {
      await expect(page.getByLabel(label)).toHaveValue("");
    }
    await expect(page.getByLabel("Senha", { exact: true })).toHaveValue("");
  });

  test("CT-05 — cadastro inválido", { tag: ["@cenario", "@RF-01", "@RF-04"] }, async ({ page }) => {
    const cases = [
      { step: "(a) senha com 7 caracteres", email: newTutor().email, password: "1234567", confirm: "1234567", message: "A senha deve ter pelo menos 8 caracteres." },
      { step: "(b) senhas diferentes", email: newTutor().email, password: "senha1234", confirm: "senha9999", message: "As senhas não coincidem." },
      { step: "(c) e-mail sem domínio", email: "ana@email", password: "senha1234", confirm: "senha1234", message: "Informe um e-mail válido." },
      { step: "(d) e-mail já cadastrado", email: demo.email, password: "senha1234", confirm: "senha1234", message: "Este e-mail já está cadastrado." },
    ];

    await page.goto("/cadastro");
    for (const item of cases) {
      await test.step(item.step, async () => {
        await page.getByLabel("Nome completo").fill("Ana Teste");
        await page.getByLabel("E-mail").fill(item.email);
        await page.getByLabel("Senha", { exact: true }).fill(item.password);
        await page.getByLabel("Confirmar senha").fill(item.confirm);
        await page.getByRole("button", { name: "Criar conta" }).click();

        await expect(page.getByRole("main").getByRole("alert")).toHaveText(item.message);
        const login = await page.request.post("/api/auth/login", { data: { email: item.email, password: item.password } });
        expect(login.status()).toBe(401);
      });
    }
  });

  test("CT-06 — página protegida sem login", { tag: ["@cenario", "@RF-09"] }, async ({ page }) => {
    for (const path of ["/dashboard", "/compromissos/novo", `/pets/${crypto.randomUUID()}`]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    }
  });

  test(
    "CT-07 — cookie de sessão forjado",
    {
      tag: ["@cenario", "@RF-09"],
      annotation: { type: "observação", description: "A tela não redireciona para o login: mostra o erro da API (OBS-03)." },
    },
    async ({ page, context, baseURL }) => {
      await context.addCookies([{ name: "petcare_session", value: "abc", url: baseURL }]);

      await page.goto("/dashboard");

      await expect(page.getByRole("main").getByRole("alert")).toContainText("Faça login para continuar.");
      await expect(page.locator('main a[href^="/pets/"]')).toHaveCount(0);
      await expect(page).toHaveURL(/\/dashboard$/);
    },
  );
});
