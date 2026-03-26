import retry from "async-retry";
import { faker } from "@faker-js/faker";

import database from "infra/database";
import migrator from "models/migrator";
import user from "models/user";
import { session } from "models/session";

const emailServiceURL = `http://${process.env.EMAIL_API_HOST}:${process.env.EMAIL_API_PORT}`;

async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, { retries: 100, maxTimeout: 1000 });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");
      if (response.status !== 200) {
        throw Error();
      }
    }
  }

  async function waitForEmailServer() {
    return retry(fetchStatusPage, { retries: 100, maxTimeout: 1000 });

    async function fetchStatusPage() {
      const response = await fetch(`${emailServiceURL}/messages`);
      if (response.status !== 200) {
        throw Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query("DROP SCHEMA public CASCADE;CREATE SCHEMA public;");
}

async function deleteAllEmails() {
  await fetch(`${emailServiceURL}/messages`, { method: "DELETE" });
}

async function getLastEmail() {
  const messagesResponse = await fetch(`${emailServiceURL}/messages`);
  const messages = await messagesResponse.json();

  if (messages.length === 0) {
    return null;
  }

  const lastMessage = messages.pop();
  const messageResponse = await fetch(
    `${emailServiceURL}/messages/${lastMessage.id}.plain`,
  );
  const text = await messageResponse.text();

  return {
    ...lastMessage,
    text,
  };
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
  deleteAllEmails,
  getLastEmail,
};
export default orchestrator;
