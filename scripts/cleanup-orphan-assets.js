import { logger } from "../src/lib/logger.js";
import { prisma } from "../src/prisma.js";
import { findAllContentRows } from "../src/repositories/contentRepository.js";
import {
  collectManagedAssetUrls,
  deleteManagedAssetByUrl,
  listAllManagedAssets,
} from "../src/services/assetService.js";

(async () => {
  try {
    const rows = await findAllContentRows();
    const referencedUrls = new Set();
    rows.forEach((row) => {
      collectManagedAssetUrls(row.data).forEach((url) => referencedUrls.add(url));
    });

    const assets = await listAllManagedAssets();
    let deleted = 0;
    let skippedReferenced = 0;
    let failed = 0;

    for (const asset of assets) {
      if (referencedUrls.has(asset.url)) {
        skippedReferenced += 1;
        continue;
      }

      try {
        const result = await deleteManagedAssetByUrl(asset.url);
        deleted += 1;
        logger.info({
          event: "asset.cleanup.orphan.deleted",
          assetId: asset.id,
          url: asset.url,
          result,
        });
      } catch (error) {
        failed += 1;
        logger.error(
          {
            event: "asset.cleanup.orphan.failed",
            assetId: asset.id,
            url: asset.url,
            message: error?.message,
          },
          error
        );
      }
    }

    logger.info({
      event: "asset.cleanup.orphan.completed",
      totalAssets: assets.length,
      deleted,
      skippedReferenced,
      failed,
    });
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    logger.error({ event: "asset.cleanup.orphan.script_failed", message: error?.message }, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
