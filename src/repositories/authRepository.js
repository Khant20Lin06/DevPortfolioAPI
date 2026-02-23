import { prisma } from "../prisma.js";

export const findUserByEmail = (email) =>
  prisma.user.findUnique({
    where: { email },
  });

export const findUserById = (id) =>
  prisma.user.findUnique({
    where: { id },
  });

export const createUser = ({ email, name, passwordHash, role = "user" }) =>
  prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role,
    },
  });

export const ensureAdminUser = async ({ email, name, passwordHash }) => {
  const existing = await findUserByEmail(email);
  if (existing) {
    if (existing.role === "admin") {
      return existing;
    }
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        role: "admin",
        name: name ?? existing.name,
      },
    });
  }

  return createUser({
    email,
    name,
    passwordHash,
    role: "admin",
  });
};
