import { prisma } from "../src/prisma.js";
import { logger } from "../src/lib/logger.js";

(async () => {
  try {
    const result = await prisma.contactSubmission.deleteMany({
      where: {
        retainedUntil: { lt: new Date() },
      },
    });

    logger.info({ event: "retention.cleanup.completed", deleted: result.count });
    process.exit(0);
  } catch (error) {
    logger.error({ event: "retention.cleanup.failed", message: error?.message }, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
