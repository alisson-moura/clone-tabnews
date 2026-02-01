import retry from "async-retry";
import { faker } from "@faker-js/faker";

import database from "infra/database";
import migrator from "models/migrator";
import user from "models/user";
import { session } from "models/session";

async function waitForAllServices() {
  await waitForWebServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, { retries: 100, maxTimeout: 1000 });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");
      if (response.status !== 200) {
        throw Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query("DROP SCHEMA public CASCADE;CREATE SCHEMA public;");
}

async function runMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userInput = {}) {
  return await user.create({
    username:
      userInput.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: userInput.email || faker.internet.email(),
    password: userInput.password || "senha_padrao",
  });
}

async function createSession(userId) {
  return await session.create(userId);
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runMigrations,
  createUser,
  createSession,
};
export default orchestrator;
