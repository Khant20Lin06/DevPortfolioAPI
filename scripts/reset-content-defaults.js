import { DEFAULT_PORTFOLIO_CONTENT } from "../src/config/defaultPortfolioContent.js";
import { logger } from "../src/lib/logger.js";
import { prisma } from "../src/prisma.js";

(async () => {
  try {
    const entries = Object.entries(DEFAULT_PORTFOLIO_CONTENT);
    for (const [key, data] of entries) {
      await prisma.portfolioContent.upsert({
        where: { key },
        create: { key, data },
        update: { data },
      });
    }
    logger.info({ event: "content.defaults.reset.completed", keys: entries.map(([key]) => key) });
    process.exit(0);
  } catch (error) {
    logger.error({ event: "content.defaults.reset.failed", message: error?.message }, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
