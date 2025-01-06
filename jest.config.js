const nextJest = require("next/jest");
const dotEnv = require("dotenv");
dotEnv.config({ path: ".env.development" });

const createJestConfig = nextJest();

const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
});

module.exports = jestConfig;
