import bcrypt from "bcryptjs";

async function hash(plainPassword) {
  return bcrypt.hash(plainPassword, getNumberOfRounds());
}

async function compare(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

function getNumberOfRounds() {
  return process.env.NODE_ENV === "production" ? 14 : 1;
}

const password = {
  hash,
  compare,
};

export default password;
