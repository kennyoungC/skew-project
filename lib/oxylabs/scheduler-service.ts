import "server-only";

import {
  createOxylabsSchedule,
  getExternalOxylabsSchedule,
  getOxylabsJobResultHtml,
  listExternalOxylabsScheduleIds,
  listOxylabsScheduleRuns,
  setOxylabsScheduleActive,
  type OxylabsSchedulePayload,
} from "@/lib/oxylabs/scheduler-client";
import { processSourceHomepageHtml } from "@/lib/scraping/source-processor";
import { DEFAULT_LIMIT_PER_SOURCE } from "@/lib/scraping/types";
import { createLog } from "@/lib/supabase/queries/logs";
import {
  createOxylabsScheduleRun,
  findExistingOxylabsRunIdentifiers,
  updateOxylabsScheduleRun,
} from "@/lib/supabase/queries/oxylabs-schedule-runs";
import {
  listOxylabsSchedules,
  saveOxylabsSchedule,
  updateOxylabsSchedule,
} from "@/lib/supabase/queries/oxylabs-schedules";
import { listActiveSources } from "@/lib/supabase/queries/sources";
import type { Json, Source } from "@/lib/supabase/types";

const OXYLABS_CRON = "0 * * * *";
const END_TIME_DAYS = 366;

export type ScheduleSyncOutcome = {
  action: "created" | "reused" | "replaced" | "failed";
  sourceId: string;
  sourceName: string;
};

export type ScheduleSyncSummary = {
  created: number;
  failed: number;
  orphanSchedulesDeactivated: number;
  outcomes: ScheduleSyncOutcome[];
  replaced: number;
  reused: number;
  sourcesChecked: number;
  status: "completed" | "partial" | "failed";
};

export type ScheduledProcessingSummary = {
  articlesFailed: number;
  articlesInserted: number;
  articlesRejected: number;
  candidatesFound: number;
  candidatesRejected: number;
  detailPagesScraped: number;
  duplicatesSkipped: number;
  durationMs: number;
  jobsDiscovered: number;
  jobsFailed: number;
  jobsProcessed: number;
  jobsSkipped: number;
  rejectionReasons: Record<string, number>;
  schedulesChecked: number;
  status: "completed" | "partial" | "failed";
};

function increment(
  values: Record<string, number>,
  key: string,
  count = 1,
): void {
  values[key] = (values[key] ?? 0) + count;
}

function endTime(): string {
  const date = new Date(Date.now() + END_TIME_DAYS * 24 * 60 * 60 * 1000);
  return date.toISOString().replace("T", " ").slice(0, 19);
}

function payloadFor(source: Source): OxylabsSchedulePayload {
  return {
    cron: OXYLABS_CRON,
    end_time: endTime(),
    items: [{ source: "universal", url: source.listing_url }],
  };
}

function storedHomepageUrl(value: Json): string | undefined {
  if (!value || Array.isArray(value) || typeof value !== "object") return;
  const items = value.items;
  if (!Array.isArray(items)) return;
  const first = items[0];
  if (!first || Array.isArray(first) || typeof first !== "object") return;
  return typeof first.url === "string" ? first.url : undefined;
}

async function logScheduler(
  event: string,
  message: string,
  options: {
    context?: Record<string, unknown>;
    level?: "info" | "warn" | "error";
    scheduleId?: string;
    scheduleRunId?: string;
    sourceId?: string;
  } = {},
): Promise<void> {
  const level = options.level ?? "info";
  console[level](`[scheduler] ${message}`);
  try {
    await createLog({
      context: (options.context ?? {}) as Json,
      event,
      level,
      message,
      schedule_id: options.scheduleId,
      schedule_run_id: options.scheduleRunId,
      source_id: options.sourceId,
    });
  } catch {
    console.warn("[scheduler] Database log write failed.", { event });
  }
}

export async function syncOxylabsSchedules(): Promise<ScheduleSyncSummary> {
  const [sources, stored, initialExternalIds] = await Promise.all([
    listActiveSources(),
    listOxylabsSchedules(),
    listExternalOxylabsScheduleIds(),
  ]);
  const externalIds = new Set(initialExternalIds);
  const activeSourceIds = new Set(sources.map((source) => source.id));
  const outcomes: ScheduleSyncOutcome[] = [];
  let created = 0;
  let reused = 0;
  let replaced = 0;
  let failed = 0;

  await logScheduler(
    "scheduler.sync_started",
    `Schedule sync started for ${sources.length} active sources.`,
  );

  for (const row of stored) {
    if (
      row.status === "active" &&
      (!activeSourceIds.has(row.source_id) || !row.source.is_active)
    ) {
      try {
        if (externalIds.has(row.schedule_id)) {
          await setOxylabsScheduleActive(row.schedule_id, false);
        }
        await updateOxylabsSchedule(row.id, {
          last_synced_at: new Date().toISOString(),
          status: "inactive",
        });
      } catch {
        await logScheduler(
          "scheduler.deactivate_failed",
          `Failed to deactivate schedule for ${row.source.name}.`,
          { level: "error", scheduleId: row.id, sourceId: row.source_id },
        );
      }
    }
  }

  for (const source of sources) {
    const existing = stored.find((row) => row.source_id === source.id);
    const locallyReusable =
      existing?.status === "active" &&
      existing.cron_expression === OXYLABS_CRON &&
      storedHomepageUrl(existing.request_payload) === source.listing_url &&
      externalIds.has(existing.schedule_id);
    let isReusable = false;
    if (locallyReusable && existing) {
      try {
        const external = await getExternalOxylabsSchedule(existing.schedule_id);
        isReusable = external.active;
      } catch {
        isReusable = false;
      }
    }

    if (isReusable && existing) {
      reused += 1;
      outcomes.push({
        action: "reused",
        sourceId: source.id,
        sourceName: source.name,
      });
      await updateOxylabsSchedule(existing.id, {
        last_synced_at: new Date().toISOString(),
      });
      continue;
    }

    try {
      if (existing && externalIds.has(existing.schedule_id)) {
        await setOxylabsScheduleActive(existing.schedule_id, false);
      }
      const payload = payloadFor(source);
      const scheduleId = await createOxylabsSchedule(payload);
      externalIds.add(scheduleId);
      await saveOxylabsSchedule({
        cron_expression: OXYLABS_CRON,
        last_synced_at: new Date().toISOString(),
        request_payload: payload as unknown as Json,
        schedule_id: scheduleId,
        source_id: source.id,
        status: "active",
      });
      if (existing) {
        replaced += 1;
        outcomes.push({
          action: "replaced",
          sourceId: source.id,
          sourceName: source.name,
        });
      } else {
        created += 1;
        outcomes.push({
          action: "created",
          sourceId: source.id,
          sourceName: source.name,
        });
      }
    } catch {
      failed += 1;
      outcomes.push({
        action: "failed",
        sourceId: source.id,
        sourceName: source.name,
      });
      if (existing) {
        await updateOxylabsSchedule(existing.id, {
          last_synced_at: new Date().toISOString(),
          status: "failed",
        }).catch(() => undefined);
      }
      await logScheduler(
        "scheduler.source_sync_failed",
        `Schedule sync failed for ${source.name}.`,
        { level: "error", sourceId: source.id },
      );
    }
  }

  const currentRows = await listOxylabsSchedules();
  const represented = new Set(
    currentRows
      .filter((row) => row.status === "active" && row.source.is_active)
      .map((row) => row.schedule_id),
  );
  const latestExternalIds = await listExternalOxylabsScheduleIds();
  let orphanSchedulesDeactivated = 0;
  for (const externalId of latestExternalIds) {
    if (represented.has(externalId)) continue;
    try {
      await setOxylabsScheduleActive(externalId, false);
      orphanSchedulesDeactivated += 1;
    } catch {
      failed += 1;
      await logScheduler(
        "scheduler.orphan_deactivate_failed",
        "Failed to deactivate an orphaned Oxylabs schedule.",
        { level: "error" },
      );
    }
  }

  const status =
    failed === 0 ? "completed" : failed < sources.length ? "partial" : "failed";
  const summary: ScheduleSyncSummary = {
    created,
    failed,
    orphanSchedulesDeactivated,
    outcomes,
    replaced,
    reused,
    sourcesChecked: sources.length,
    status,
  };
  await logScheduler(
    "scheduler.sync_completed",
    `Schedule sync ${status}: ${created} created, ${reused} reused, ${replaced} replaced, ${failed} failed.`,
    { context: summary },
  );
  return summary;
}

export async function processScheduledResults(): Promise<ScheduledProcessingSummary> {
  const startedAt = Date.now();
  const schedules = (await listOxylabsSchedules()).filter(
    (row) => row.status === "active" && row.source.is_active,
  );
  const rejectionReasons: Record<string, number> = {};
  const runSeenUrls = new Set<string>();
  let jobsDiscovered = 0;
  let jobsProcessed = 0;
  let jobsSkipped = 0;
  let jobsFailed = 0;
  let candidatesFound = 0;
  let candidatesRejected = 0;
  let duplicatesSkipped = 0;
  let detailPagesScraped = 0;
  let articlesInserted = 0;
  let articlesRejected = 0;
  let articlesFailed = 0;

  await logScheduler(
    "scheduler.processing_started",
    `Scheduled result processing started for ${schedules.length} schedules.`,
  );

  for (const schedule of schedules) {
    let runs;
    try {
      runs = await listOxylabsScheduleRuns(schedule.schedule_id);
    } catch {
      jobsFailed += 1;
      await logScheduler(
        "scheduler.runs_failed",
        `Failed to load runs for ${schedule.source.name}.`,
        {
          level: "error",
          scheduleId: schedule.id,
          sourceId: schedule.source_id,
        },
      );
      continue;
    }

    const doneJobs = runs.flatMap((run) =>
      run.jobs
        .filter((job) => job.resultStatus === "done")
        .map((job) => ({ job, runId: run.runId })),
    );
    jobsDiscovered += doneJobs.length;
    const existing = await findExistingOxylabsRunIdentifiers(schedule.id, {
      jobIds: doneJobs.map(({ job }) => job.id),
    });

    for (const { job, runId } of doneJobs) {
      if (existing.jobIds.has(job.id)) {
        jobsSkipped += 1;
        continue;
      }

      let localRun;
      try {
        localRun = await createOxylabsScheduleRun({
          external_job_id: job.id,
          external_run_id: runId,
          oxylabs_schedule_id: schedule.id,
          result_status: "done",
          started_at: new Date().toISOString(),
          status: "processing",
        });
      } catch {
        jobsSkipped += 1;
        continue;
      }

      try {
        const homepageHtml = await getOxylabsJobResultHtml(job.id);
        const result = await processSourceHomepageHtml({
          homepageHtml,
          limitPerSource: DEFAULT_LIMIT_PER_SOURCE,
          onProgress: (event) =>
            logScheduler(event.event, event.message, {
              context: event.context,
              level: event.level === "debug" ? "info" : event.level,
              scheduleId: schedule.id,
              scheduleRunId: localRun.id,
              sourceId: schedule.source_id,
            }),
          runSeenUrls,
          source: schedule.source,
        });
        jobsProcessed += 1;
        candidatesFound += result.candidatesFound;
        candidatesRejected += result.candidatesRejected;
        duplicatesSkipped += result.duplicatesSkipped;
        detailPagesScraped += result.detailPagesScraped;
        articlesInserted += result.articlesInserted;
        articlesRejected += result.articlesRejected;
        articlesFailed += result.articlesFailed;
        for (const [reason, count] of Object.entries(result.rejectionReasons)) {
          increment(rejectionReasons, reason, count);
        }
        await updateOxylabsScheduleRun(localRun.id, {
          processed_at: new Date().toISOString(),
          status: "completed",
          summary: result as unknown as Json,
        });
      } catch {
        jobsFailed += 1;
        await updateOxylabsScheduleRun(localRun.id, {
          error: { reason: "scheduled_job_processing_failed" },
          processed_at: new Date().toISOString(),
          status: "failed",
        }).catch(() => undefined);
        await logScheduler(
          "scheduler.job_failed",
          `Scheduled job processing failed for ${schedule.source.name}.`,
          {
            level: "error",
            scheduleId: schedule.id,
            scheduleRunId: localRun.id,
            sourceId: schedule.source_id,
          },
        );
      }
    }
  }

  const status =
    jobsFailed === 0
      ? "completed"
      : jobsProcessed > 0 || jobsSkipped > 0
        ? "partial"
        : "failed";
  const summary: ScheduledProcessingSummary = {
    articlesFailed,
    articlesInserted,
    articlesRejected,
    candidatesFound,
    candidatesRejected,
    detailPagesScraped,
    duplicatesSkipped,
    durationMs: Date.now() - startedAt,
    jobsDiscovered,
    jobsFailed,
    jobsProcessed,
    jobsSkipped,
    rejectionReasons,
    schedulesChecked: schedules.length,
    status,
  };
  await logScheduler(
    "scheduler.processing_completed",
    `Scheduled result processing ${status}: ${jobsProcessed} processed, ${jobsSkipped} skipped, ${jobsFailed} failed.`,
    { context: summary, level: status === "failed" ? "error" : "info" },
  );
  return summary;
}
