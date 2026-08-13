import { describe, expect, it } from "vitest";

import {
	getSettingsEffect,
	mergeSettingsEffects,
} from "../src/settings/settingsEffects";

describe("getSettingsEffect", () => {
	it("does not rebuild the index for UI-only settings", () => {
		expect(getSettingsEffect("timelineDotColor")).toEqual({
			refreshTimelineViews: true,
			rebuildIndex: false,
			refreshDayProperties: false,
			rewriteEntryMarkdown: false,
		});
	});

	it("rebuilds the index once when the timeline folder changes", () => {
		expect(getSettingsEffect("timelineFolder")).toEqual({
			refreshTimelineViews: true,
			rebuildIndex: true,
			refreshDayProperties: false,
			rewriteEntryMarkdown: false,
		});
	});

	it("only refreshes properties for frontmatter settings", () => {
		expect(getSettingsEffect("propertyEnrichmentEnabled")).toEqual({
			refreshTimelineViews: false,
			rebuildIndex: false,
			refreshDayProperties: true,
			rewriteEntryMarkdown: false,
		});
	});

	it("rewrites Markdown and performs a single rebuild for tag output", () => {
		expect(getSettingsEffect("writeTagsAsObsidianTags")).toEqual({
			refreshTimelineViews: true,
			rebuildIndex: true,
			refreshDayProperties: false,
			rewriteEntryMarkdown: true,
		});
	});
});

describe("mergeSettingsEffects", () => {
	it("combines pending work without losing any effect", () => {
		expect(
			mergeSettingsEffects(
				getSettingsEffect("timelineFolder"),
				getSettingsEffect("propertyEnrichmentEnabled"),
			),
		).toEqual({
			refreshTimelineViews: true,
			rebuildIndex: true,
			refreshDayProperties: true,
			rewriteEntryMarkdown: false,
		});
	});
});
