import { describe, expect, it } from "vitest";
import { CHANNEL_STATUSES, TASK_STATUSES, channelSchema, nextStatus, taskSchema, trackedLink } from "./validation";

describe("marketing plan", () => {
  it("cycles statuses and wraps around", () => {
    expect(nextStatus(TASK_STATUSES, "TODO")).toBe("DOING");
    expect(nextStatus(TASK_STATUSES, "DOING")).toBe("DONE");
    expect(nextStatus(TASK_STATUSES, "DONE")).toBe("TODO");
    expect(nextStatus(CHANNEL_STATUSES, "ACTIVE")).toBe("TODO");
  });

  it("validates a new task from the admin form", () => {
    const ok = taskSchema.parse({ week: "2", title: " Post explainer ", channel: "tiktok", kind: "CONTENT", owner: "YOU", dueDate: "2026-11-06", link: "", notes: "" });
    expect(ok).toMatchObject({ week: 2, title: "Post explainer", link: null, notes: null });
    expect(ok.dueDate?.toISOString().slice(0, 10)).toBe("2026-11-06");
    expect(taskSchema.safeParse({ week: "1", title: "", kind: "CONTENT", owner: "YOU" }).success).toBe(false);
    expect(taskSchema.safeParse({ week: "1", title: "x", kind: "PARTY", owner: "YOU" }).success).toBe(false);
  });

  it("empties channel fields to null and builds tagged links", () => {
    expect(channelSchema.parse({ handle: "", url: " https://tiktok.com/@agyal " })).toEqual({ handle: null, url: "https://tiktok.com/@agyal" });
    expect(trackedLink("tiktok")).toBe("https://agyal.net/ar?utm_source=tiktok&utm_medium=social");
  });
});
