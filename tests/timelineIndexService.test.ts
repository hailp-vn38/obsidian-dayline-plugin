import { describe, expect, it, vi } from "vitest";

import { TFile, TFolder, type App } from "obsidian";
import { TimelineIndexService } from "../src/index/TimelineIndexService";
import { DEFAULT_SETTINGS } from "../src/settings/settings";

const EMPTY_DAY = `---
type: timeline-day
---
`;

describe("TimelineIndexService", () => {
	it("limits rebuild read concurrency and ignores unchanged mtimes", async () => {
		const folder = new TFolder();
		folder.path = "Timeline";
		folder.children = Array.from({ length: 8 }, (_, index) => {
			const file = new TFile();
			file.path = `Timeline/2026-08-${`${index + 1}`.padStart(2, "0")}.md`;
			file.stat.mtime = 1;
			return file;
		});

		let activeReads = 0;
		let maxActiveReads = 0;
		const cachedRead = vi.fn(async () => {
			activeReads += 1;
			maxActiveReads = Math.max(maxActiveReads, activeReads);
			await new Promise((resolve) => setTimeout(resolve, 2));
			activeReads -= 1;
			return EMPTY_DAY;
		});
		const app = {
			vault: {
				getAbstractFileByPath: () => folder,
				cachedRead,
			},
		} as unknown as App;
		const service = new TimelineIndexService(app, { ...DEFAULT_SETTINGS });

		await service.rebuild();
		expect(service.getStatus()).toBe("ready");
		expect(maxActiveReads).toBeLessThanOrEqual(4);

		const firstFile = folder.children[0];
		expect(firstFile).toBeInstanceOf(TFile);
		if (!(firstFile instanceof TFile)) return;
		await expect(service.refreshFile(firstFile)).resolves.toBe(false);
	});

	it("updates and removes only the affected cached file", async () => {
		const folder = new TFolder();
		folder.path = "Timeline";
		const file = new TFile();
		file.path = "Timeline/2026-08-13.md";
		file.stat.mtime = 1;
		folder.children = [file];
		let markdown = createDayMarkdown("tl-first", "First");
		const app = {
			vault: {
				getAbstractFileByPath: () => folder,
				cachedRead: vi.fn(async () => markdown),
			},
		} as unknown as App;
		const service = new TimelineIndexService(app, { ...DEFAULT_SETTINGS });

		await service.rebuild();
		expect(service.getAll().map((item) => item.id)).toEqual(["tl-first"]);

		markdown = createDayMarkdown("tl-updated", "Updated");
		file.stat.mtime = 2;
		await expect(service.refreshFile(file)).resolves.toBe(true);
		expect(service.getAll().map((item) => item.id)).toEqual(["tl-updated"]);

		expect(service.removeBySourcePath(file.path)).toBe(true);
		expect(service.getAll()).toEqual([]);
		expect(service.removeBySourcePath(file.path)).toBe(false);
	});
});

function createDayMarkdown(id: string, content: string): string {
	return `---
type: timeline-day
---
## 09:00 ^${id}
<!-- timeline-entry {"schemaVersion":1,"id":"${id}","type":"checkin","date":"2026-08-13","time":"09:00","createdAt":"2026-08-13T02:00:00.000Z","updatedAt":"2026-08-13T02:00:00.000Z","tags":[],"source":"manual","attachments":[]} -->
${content}
`;
}
