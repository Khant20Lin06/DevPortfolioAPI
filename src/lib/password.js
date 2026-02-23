import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export const hashPassword = async (plainPassword) => bcrypt.hash(plainPassword, SALT_ROUNDS);

export const verifyPassword = async (plainPassword, passwordHash) =>
  bcrypt.compare(plainPassword, passwordHash);
