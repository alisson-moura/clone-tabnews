import activation from "models/activation";
import user from "models/user";
import orchestrator from "tests/orchestrator.js";
import { v4 as uuidv4 } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runMigrations();
});

describe("PATCH /api/v1/activations/[token_id]", () => {
  describe("Usuário Anônimo", () => {
    test("Com token inexistente", async () => {
      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${uuidv4()}`,
        { method: "PATCH" },
      );

      expect(response.status).toBe(404);
    });

    test("Com token expirado", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_TIME_IN_MS),
      });

      const createdUser = await orchestrator.createUser();
      const expiredActivationToken = await activation.createActivationToken(
        createdUser.id,
      );

      jest.useRealTimers();

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${expiredActivationToken.id}`,
        { method: "PATCH" },
      );

      expect(response.status).toBe(404);
    });

    test("Com um token que já foi usado", async () => {
      const createdUser = await orchestrator.createUser();
      const activationToken = await activation.createActivationToken(
        createdUser.id,
      );
      await activation.markTokenAsUsed(activationToken.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        { method: "PATCH" },
      );

      expect(response.status).toBe(404);
    });

    test("Com um token válido", async () => {
      const createdUser = await orchestrator.createUser();
      const activationToken = await activation.createActivationToken(
        createdUser.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        { method: "PATCH" },
      );

      const responseBody = await response.json();
      const activatedUser = await user.findOneById(responseBody.user_id);

      expect(response.status).toBe(200);
      expect(activatedUser.features).toEqual([
        "create:session",
        "read:session",
      ]);
    });

    test("Com token válido mas usuário já ativo", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      const activationToken = await activation.createActivationToken(
        createdUser.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        { method: "PATCH" },
      );

      expect(response.status).toBe(403);
    });
  });

  describe("Usuário Logado", () => {});
});
