import { DEFAULT_PORTFOLIO_CONTENT } from "../config/defaultPortfolioContent.js";
import { ValidationError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { validateContentUpdate } from "../lib/validation.js";
import {
  findAllContentRows,
  findContentByKey,
  upsertContentByKey,
} from "../repositories/contentRepository.js";
import { collectManagedAssetUrls, deleteManagedAssetByUrl } from "./assetService.js";

const clone = (value) => JSON.parse(JSON.stringify(value));

const toContentMap = (rows) => {
  const map = {};
  for (const row of rows) {
    map[row.key] = row.data;
  }
  return map;
};

export const getPortfolioContent = async () => {
  const rows = await findAllContentRows();
  const map = toContentMap(rows);

  return {
    ...clone(DEFAULT_PORTFOLIO_CONTENT),
    ...map,
  };
};

export const getAdminContent = async () => {
  const content = await getPortfolioContent();
  return {
    keys: Object.keys(content),
    content,
  };
};

export const updatePortfolioContent = async ({ key, data, userId }) => {
  const parsed = validateContentUpdate({ key, data });
  if (!parsed.ok) {
    throw new ValidationError(parsed.fieldErrors);
  }

  const existing = await findContentByKey(key);
  const previousUrls = collectManagedAssetUrls(existing?.data ?? {});
  const nextUrls = collectManagedAssetUrls(parsed.data);

  const updated = await upsertContentByKey({
    key,
    data: parsed.data,
    updatedById: userId,
  });

  if (previousUrls.size > 0) {
    const removedUrls = [...previousUrls].filter((url) => !nextUrls.has(url));
    if (removedUrls.length > 0) {
      const rows = await findAllContentRows();
      const stillReferenced = new Set();
      rows.forEach((row) => {
        collectManagedAssetUrls(row.data).forEach((url) => {
          stillReferenced.add(url);
        });
      });

      for (const url of removedUrls) {
        if (stillReferenced.has(url)) {
          logger.info({
            event: "asset.replace.cleanup.skipped_referenced",
            key,
            url,
          });
          continue;
        }

        try {
          const result = await deleteManagedAssetByUrl(url);
          logger.info({
            event: "asset.replace.cleanup.deleted",
            key,
            url,
            result,
          });
        } catch (error) {
          logger.error(
            {
              event: "asset.replace.cleanup.failed",
              key,
              url,
              message: error?.message,
            },
            error
          );
        }
      }
    }
  }

  return {
    key: updated.key,
    data: updated.data,
    updatedAt: updated.updatedAt,
  };
};
