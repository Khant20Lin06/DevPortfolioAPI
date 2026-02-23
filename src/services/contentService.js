import { DEFAULT_PORTFOLIO_CONTENT } from "../config/defaultPortfolioContent.js";
import { ValidationError } from "../lib/errors.js";
import { validateContentUpdate } from "../lib/validation.js";
import { findAllContentRows, upsertContentByKey } from "../repositories/contentRepository.js";

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

  const updated = await upsertContentByKey({
    key,
    data: parsed.data,
    updatedById: userId,
  });

  return {
    key: updated.key,
    data: updated.data,
    updatedAt: updated.updatedAt,
  };
};
