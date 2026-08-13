import { beforeEach, describe, expect, it, vi } from "vitest";

import { TFile } from "obsidian";
import type DaylinePlugin from "../src/main";
import {
	invalidateTimelineMetadataCache,
	readTimelineMetadataEntries,
} from "../src/reading/renderTimelineMetadata";

const MARKDOWN = `---
type: timeline-day
---
## 09:00 ^tl-test
<!-- timeline-entry {"schemaVersion":1,"id":"tl-test","type":"checkin","date":"2026-08-13","time":"09:00","createdAt":"2026-08-13T02:00:00.000Z","updatedAt":"2026-08-13T02:00:00.000Z","tags":[],"source":"manual","attachments":[]} -->
Hello
`;

describe("reading metadata cache", () => {
	let cachedRead: ReturnType<typeof vi.fn>;
	let plugin: DaylinePlugin;
	let file: TFile;

	beforeEach(() => {
		cachedRead = vi.fn().mockResolvedValue(MARKDOWN);
		plugin = {
			app: { vault: { cachedRead } },
		} as unknown as DaylinePlugin;
		file = new TFile();
		file.path = "Timeline/2026/08/13.md";
		file.stat.mtime = 1;
	});

	it("reads and parses once for the same path and mtime", async () => {
		const first = await readTimelineMetadataEntries(plugin, file);
		const second = await readTimelineMetadataEntries(plugin, file);

		expect(first).toHaveLength(1);
		expect(second).toHaveLength(1);
		expect(cachedRead).toHaveBeenCalledTimes(1);
	});

	it("reloads after mtime changes or the path is invalidated", async () => {
		await readTimelineMetadataEntries(plugin, file);
		file.stat.mtime = 2;
		await readTimelineMetadataEntries(plugin, file);
		invalidateTimelineMetadataCache(plugin, file.path);
		await readTimelineMetadataEntries(plugin, file);

		expect(cachedRead).toHaveBeenCalledTimes(3);
	});
});
