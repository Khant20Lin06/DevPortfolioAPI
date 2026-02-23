import { ensureConfiguredAdmin } from "../src/services/authService.js";
import { logger } from "../src/lib/logger.js";
import { prisma } from "../src/prisma.js";

(async () => {
  try {
    await ensureConfiguredAdmin();
    logger.info({ event: "auth.seed_admin.script_complete" });
    process.exit(0);
  } catch (error) {
    logger.error({ event: "auth.seed_admin.script_failed", message: error?.message }, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
