import email from "infra/email";
import orchestrator from "tests/orchestrator";

describe("Email", () => {
  beforeAll(async () => {
    await orchestrator.waitForAllServices();
  });

  beforeEach(async () => {
    await orchestrator.deleteAllEmails();
  });

  test("deve enviar um email", async () => {
    await email.send({
      to: "test@mail.com.br",
      subject: "Teste de email",
      text: "Este é um teste de email",
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail).not.toBeNull();
    expect(lastEmail.recipients).toEqual(["<test@mail.com.br>"]);
    expect(lastEmail.subject).toEqual("Teste de email");
    expect(lastEmail.text).toEqual("Este é um teste de email\r\n");
  });
});
