import { prisma } from "../prisma.js";

export const findPortfolioViewByVisitorKey = ({ visitorKey }) =>
  prisma.portfolioView.findUnique({
    where: { visitorKey },
  });

export const createPortfolioView = ({ visitorKey, userId = null }) =>
  prisma.portfolioView.create({
    data: {
      visitorKey,
      userId,
    },
  });

export const countPortfolioViews = () =>
  prisma.portfolioView.count();
