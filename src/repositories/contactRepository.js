import { prisma } from "../prisma.js";

export const createContactMessage = ({ name, email, message }) =>
  prisma.contactMessage.create({
    data: {
      name,
      email,
      message,
    },
  });

export const listContactMessages = () =>
  prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });
