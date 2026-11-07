import { createRequire } from "node:module";
const require = createRequire("/home/educm/Studies/InterfaceProgramming/PetCare/package.json");
const { chromium } = require("@playwright/test");
const root = "/home/educm/Studies/InterfaceProgramming/PetCare";
const out = `${root}/.vitest/prints`;
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1100, height: 900 }, colorScheme: "light", deviceScaleFactor: 2 });
const page = await context.newPage();

await page.goto(`file://${root}/.vitest/requisitos.html`);
await page.locator(".requirements").screenshot({ path: `${out}/cards.png` });
await page.locator("details[data-file]", { hasText: "e2e/interface.spec.ts" }).screenshot({ path: `${out}/list-e2e.png` });
await page.locator("details[data-file]", { hasText: "4-http/auth.test.ts" }).screenshot({ path: `${out}/list-auth.png` });

await page.goto(`file://${root}/.vitest/apresentacao.html`);
await page.locator("header").screenshot({ path: `${out}/header.png` });
const sections = { unit: "Unitários", integration: "Integração bottom-up", e2e: "Ponta a ponta", requirements: "Baseados em requisitos", scenarios: "Baseados em cenário", performance: "Desempenho" };
for (const [name, title] of Object.entries(sections)) {
  const section = page.locator("main > section").filter({ has: page.locator("h2", { hasText: title }) });
  await section.screenshot({ path: `${out}/${name}.png` });
}
await browser.close();
console.log("prints ok");
