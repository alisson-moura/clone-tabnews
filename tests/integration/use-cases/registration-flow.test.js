import orchestrator from "tests/orchestrator";
import activation from "models/activation";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.deleteAllEmails();
  await orchestrator.runMigrations();
});

describe("Use Case: Registration Flow", () => {
  describe("All successful", () => {
    let createUserBody;

    test("Criar uma conta de usuário", async () => {
      const createUserResponse = await fetch(
        "http://localhost:3000/api/v1/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "user.tester",
            email: "tester@example.com",
            password: "password@123",
          }),
        },
      );
      createUserBody = await createUserResponse.json();

      expect(createUserResponse.status).toBe(201);
      expect(createUserBody.features.includes("read:activation_token")).toBe(
        true,
      );
    });

    test("Receber um e-mail de ativação", async () => {
      const lastEmail = await orchestrator.getLastEmail();
      const activationToken = await activation.findOneByUserId(
        createUserBody.id,
      );

      expect(lastEmail.recipients).toContain("<tester@example.com>");
      expect(lastEmail.subject).toBe("Ative sua conta no Clone TabNews");
      expect(lastEmail.text).toMatch(/user.tester/i);
      expect(lastEmail.text).toContain(activationToken.id);
    });

    test.todo("Ativar a conta de usuário");
    test.todo("Fazer login com a conta de usuário");
    test.todo("Acessar informações do usuário");
  });
});
