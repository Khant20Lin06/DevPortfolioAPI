import { Resend } from "resend";
import { env } from "../config/env.js";
import { nextRetryDate } from "../lib/backoff.js";
import { logger } from "../lib/logger.js";
import { incrementMetric, setGauge } from "../lib/metrics.js";
import {
  getPendingOutboxCount,
  markOutboxJobFailure,
  markOutboxJobProcessing,
  markOutboxJobSent,
  recordAuditEvent,
  takePendingOutboxJobs,
} from "../repositories/contactRepository.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const safeErrorMessage = (error) => {
  const message = error?.message ?? "unknown_error";
  return String(message).slice(0, 300);
};

const sendOwnerNotification = async (submission) => {
  if (!resend || !env.CONTACT_OWNER_EMAIL) {
    logger.info({ event: "contact.outbox.mock_send.owner", submissionId: submission.id });
    return;
  }

  await resend.emails.send({
    from: env.CONTACT_FROM_EMAIL,
    to: [env.CONTACT_OWNER_EMAIL],
    subject: `New contact lead from ${submission.name}`,
    replyTo: submission.email,
    html: `
      <h2>New Contact Submission</h2>
      <p><strong>Name:</strong> ${submission.name}</p>
      <p><strong>Email:</strong> ${submission.email}</p>
      <p><strong>Company:</strong> ${submission.company ?? "-"}</p>
      <p><strong>Budget:</strong> ${submission.budget ?? "-"}</p>
      <p><strong>Timeline:</strong> ${submission.timeline ?? "-"}</p>
      <p><strong>Source:</strong> ${submission.source ?? "-"}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap">${submission.message}</pre>
    `,
  });
};

const sendSubmitterAck = async (submission) => {
  if (!resend) {
    logger.info({ event: "contact.outbox.mock_send.submitter", submissionId: submission.id });
    return;
  }

  await resend.emails.send({
    from: env.CONTACT_FROM_EMAIL,
    to: [submission.email],
    subject: "Thanks for reaching out",
    html: `
      <h2>Thanks for contacting us</h2>
      <p>Hi ${submission.name},</p>
      <p>Your message was received. We will get back to you shortly.</p>
    `,
  });
};

const deliverOutboxJob = async (job) => {
  if (job.jobType === "owner_notify") {
    return sendOwnerNotification(job.submission);
  }

  if (job.jobType === "submitter_ack") {
    return sendSubmitterAck(job.submission);
  }

  throw new Error(`Unknown job type: ${job.jobType}`);
};

export const runOutboxBatch = async () => {
  const jobs = await takePendingOutboxJobs(env.OUTBOX_BATCH_SIZE);

  const summary = {
    picked: jobs.length,
    sent: 0,
    retried: 0,
    dead: 0,
    skipped: 0,
  };

  for (const job of jobs) {
    const claimed = await markOutboxJobProcessing({
      jobId: job.id,
      currentStatus: job.status,
    });

    if (!claimed) {
      summary.skipped += 1;
      continue;
    }

    try {
      await deliverOutboxJob(job);
      await markOutboxJobSent({ jobId: job.id });
      incrementMetric("contact.outbox.sent");
      summary.sent += 1;
    } catch (error) {
      const attemptCount = job.attemptCount + 1;
      const isDead = attemptCount >= env.OUTBOX_MAX_ATTEMPTS;
      const nextAttemptAt = isDead ? new Date(0) : nextRetryDate(attemptCount);
      const status = isDead ? "dead" : "failed";
      const errorMessage = safeErrorMessage(error);

      await markOutboxJobFailure({
        jobId: job.id,
        status,
        attemptCount,
        nextAttemptAt,
        errorCode: "DELIVERY_FAILED",
        errorMessage,
      });

      await recordAuditEvent({
        submissionId: job.submissionId,
        eventType: isDead ? "contact.outbox.dead" : "contact.outbox.retry",
        severity: isDead ? "error" : "warning",
        payloadJson: {
          jobId: job.id,
          attemptCount,
          errorMessage,
        },
      });

      incrementMetric(isDead ? "contact.outbox.dead" : "contact.outbox.retry");
      summary[isDead ? "dead" : "retried"] += 1;

      logger.warn({
        event: isDead ? "contact.outbox.dead" : "contact.outbox.retry",
        jobId: job.id,
        attemptCount,
        errorMessage,
      });
    }
  }

  const queueDepth = await getPendingOutboxCount();
  setGauge("contact.outbox.depth", queueDepth);

  return {
    ...summary,
    queueDepth,
  };
};