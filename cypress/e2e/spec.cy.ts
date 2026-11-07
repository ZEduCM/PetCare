describe("template spec", () => {
  it("passes", () => {
    cy.visit("http://localhost:3000");
    cy.get("div.flex button.bg-primary").click();
    cy.get("p.mt-\\[18px\\]").click();
    cy.get("#email").click();
    cy.get("#email").type("demo@petcare.com");
    cy.get("p.mt-\\[18px\\]").click();
    cy.get("#password").click();
    cy.get("#password").type("petcare123");
    cy.get("button.w-full").click();
    cy.get("div.gap-\\[15px\\] a:nth-child(1)").click();
    cy.get("a.inline-flex").click();
    cy.get(
      'button[aria-label="Banhos e higiene: 1. Ver detalhes"] strong.block',
    ).click();
    cy.get("svg.lucide-x").click();
    cy.get(
      'button[aria-label="Pets cadastrados: 3. Ver detalhes"] strong.block',
    ).click();
    cy.get("svg.lucide-x").click();
    cy.get("a.text-muted").click();
    cy.get("div.grid").click();
    cy.get('[name="title"]').click();
    cy.get('[name="title"]').type("Teste");
    cy.get('[name="petId"]').select("44767b20-2fe5-455c-aa0b-65933fd955ee");
    cy.get('[name="category"]').select("Alimentação");
    cy.get('[name="date"]').click();
    cy.get('[name="date"]').type("2026-05-20");
    cy.get("div.grid").click();
    cy.get('[name="time"]').click();
    cy.get('[name="time"]').type("09:00");
    cy.get('button.flex.font-bold').click();
  });
});
