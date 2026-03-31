import orchestrator from "tests/orchestrator";
import utils from "tests/utils";
import activation from "models/activation";
import webserver from "infra/webserver";

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
      
      const activationToken = await activation.findOneValidById(
        utils.extractUUIDFromText(lastEmail.text)
      );

      expect(lastEmail.recipients).toContain("<tester@example.com>");
      expect(lastEmail.subject).toBe("Ative sua conta no Clone TabNews");
      expect(lastEmail.text).toMatch(/user.tester/i);
      
      expect(lastEmail.text).toContain(
        `${webserver.origin}/cadastro/ativar/${activationToken.id}`
      );
      expect(activationToken.user_id).toEqual(createUserBody.id);
      expect(activationToken.used_at).toBeNull();
    });

    test.todo("Ativar a conta de usuário");
    test.todo("Fazer login com a conta de usuário");
    test.todo("Acessar informações do usuário");
  });
});
