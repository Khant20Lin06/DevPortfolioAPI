import { runOutboxBatch } from "../src/services/outboxService.js";
import { logger } from "../src/lib/logger.js";
import { prisma } from "../src/prisma.js";
import "../src/lib/sentry.js";

(async () => {
  try {
    const summary = await runOutboxBatch();
    logger.info({ event: "outbox.batch.completed", summary });
    process.exit(0);
  } catch (error) {
    logger.error({ event: "outbox.batch.failed", message: error?.message }, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();