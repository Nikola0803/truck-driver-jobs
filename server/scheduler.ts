/**
 * Zero-dependency daily job scheduler.
 * Fires tasks at a fixed UTC hour:minute each day.
 * Uses recursive setTimeout so it self-corrects if the server drifts.
 */

type ScheduledTask = {
  name: string;
  hourUTC: number;
  minuteUTC: number;
  fn: () => Promise<void>;
};

function msUntilNext(hourUTC: number, minuteUTC: number): number {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(hourUTC, minuteUTC, 0, 0);
  if (next <= now) {
    // Already passed today — schedule for tomorrow
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next.getTime() - now.getTime();
}

function formatUTC(hourUTC: number, minuteUTC: number): string {
  const h = String(hourUTC).padStart(2, "0");
  const m = String(minuteUTC).padStart(2, "0");
  return `${h}:${m} UTC`;
}

export function registerScheduledTask(task: ScheduledTask): void {
  const schedule = () => {
    const delay = msUntilNext(task.hourUTC, task.minuteUTC);
    const nextRun = new Date(Date.now() + delay);
    console.log(
      `[Scheduler] "${task.name}" next run: ${nextRun.toUTCString()} (${formatUTC(task.hourUTC, task.minuteUTC)} daily)`
    );

    setTimeout(async () => {
      console.log(`[Scheduler] Running "${task.name}" at ${new Date().toUTCString()}`);
      try {
        await task.fn();
        console.log(`[Scheduler] "${task.name}" completed OK`);
      } catch (e) {
        console.error(`[Scheduler] "${task.name}" failed:`, e);
      }
      // Reschedule for tomorrow
      schedule();
    }, delay);
  };

  schedule();
}
