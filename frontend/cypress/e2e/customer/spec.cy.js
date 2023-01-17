describe("Main Page", () => {
  it("passes", () => {
    cy.visit("https://staging.bluenotary.us");
  });
});
describe("Do Login", () => {
  it("passes", () => {
    cy.get("[aria-label='Email']").type("rohcustomer@mailinator.com");
    cy.get("[aria-label='Password']").type("234567");
    cy.get("button").click();
  });
});
describe("Check Dashboard URL", () => {
  it("passes", () => {
    cy.url().should("include", "/business");
  });
});
