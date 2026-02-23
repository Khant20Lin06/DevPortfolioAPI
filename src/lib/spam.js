const suspiciousPatterns = [
  /crypto/i,
  /casino/i,
  /viagra/i,
  /loan/i,
  /seo\s+service/i,
  /telegram/i,
  /whatsapp\s+group/i,
  /http:\/\//i,
];

export const scoreSpamSignal = ({ message, website, ipDayCount, emailDayCount, duplicateRecent }) => {
  let score = 0;
  const reasons = [];

  const urlMatches = (message.match(/https?:\/\//gi) ?? []).length;
  if (urlMatches >= 2) {
    score += 30;
    reasons.push("multiple_urls");
  }

  if (message.length < 40) {
    score += 10;
    reasons.push("short_message");
  }

  if (message === message.toUpperCase() && /[A-Z]/.test(message)) {
    score += 15;
    reasons.push("all_caps");
  }

  if (suspiciousPatterns.some((pattern) => pattern.test(message))) {
    score += 35;
    reasons.push("suspicious_keywords");
  }

  if (website && website.length > 0) {
    score += 100;
    reasons.push("honeypot_triggered");
  }

  if (ipDayCount >= 12) {
    score += 35;
    reasons.push("high_ip_volume");
  }

  if (emailDayCount >= 2) {
    score += 20;
    reasons.push("high_email_volume");
  }

  if (duplicateRecent) {
    score += 20;
    reasons.push("duplicate_recent");
  }

  const quarantine = score >= 70;

  return { score, reasons, quarantine };
};