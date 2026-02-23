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

export const findContactMessageById = ({ id }) =>
  prisma.contactMessage.findUnique({
    where: { id },
  });

export const updateContactMessageById = ({ id, name, email, message }) =>
  prisma.contactMessage.update({
    where: { id },
    data: {
      name,
      email,
      message,
    },
  });

export const deleteContactMessageById = ({ id }) =>
  prisma.contactMessage.delete({
    where: { id },
  });
