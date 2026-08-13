import { describe, expect, it, vi } from "vitest";

import type { TimelineIndexService } from "../src/index/TimelineIndexService";
import { TimelineSettingsService } from "../src/settings/TimelineSettingsService";
import { getSettingsEffect } from "../src/settings/settingsEffects";
import type { TimelineRepository } from "../src/storage/timelineRepository";

describe("TimelineSettingsService", () => {
	it("does not touch vault data or the index for UI-only settings", async () => {
		const persist = vi.fn().mockResolvedValue(undefined);
		const refreshAllDayProperties = vi.fn();
		const rebuild = vi.fn();
		const repository = {
			refreshAllDayProperties,
			rewriteAllEntryMarkdownForCurrentSettings: vi.fn(),
		} as unknown as TimelineRepository;
		const index = {
			rebuild,
		} as unknown as TimelineIndexService;
		const refreshTimelineViews = vi.fn().mockResolvedValue(undefined);
		const service = new TimelineSettingsService({
			persist,
			repository,
			index,
			refreshTimelineViews,
		});

		await service.apply(getSettingsEffect("timelineDotColor"));
		expect(persist).toHaveBeenCalledTimes(1);
		expect(refreshAllDayProperties).not.toHaveBeenCalled();
		expect(rebuild).not.toHaveBeenCalled();
		expect(refreshTimelineViews).toHaveBeenCalledTimes(1);
	});

	it("runs one rewrite and one rebuild for tag Markdown output", async () => {
		const refreshAllDayProperties = vi.fn();
		const rewriteEntryMarkdown = vi.fn().mockResolvedValue(undefined);
		const rebuild = vi.fn().mockResolvedValue(undefined);
		const repository = {
			refreshAllDayProperties,
			rewriteAllEntryMarkdownForCurrentSettings: rewriteEntryMarkdown,
		} as unknown as TimelineRepository;
		const index = {
			rebuild,
		} as unknown as TimelineIndexService;
		const service = new TimelineSettingsService({
			persist: vi.fn().mockResolvedValue(undefined),
			repository,
			index,
			refreshTimelineViews: vi.fn().mockResolvedValue(undefined),
		});

		await service.apply(getSettingsEffect("writeTagsAsObsidianTags"));
		expect(rewriteEntryMarkdown).toHaveBeenCalledTimes(1);
		expect(refreshAllDayProperties).not.toHaveBeenCalled();
		expect(rebuild).toHaveBeenCalledTimes(1);
	});
});
