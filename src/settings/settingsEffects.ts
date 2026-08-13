import type { TimelinePluginSettings } from "../models/TimelineSettings";

export interface SettingsEffect {
	refreshTimelineViews: boolean;
	rebuildIndex: boolean;
	refreshDayProperties: boolean;
	rewriteEntryMarkdown: boolean;
}

const NO_EFFECT: SettingsEffect = {
	refreshTimelineViews: false,
	rebuildIndex: false,
	refreshDayProperties: false,
	rewriteEntryMarkdown: false,
};

const UI_EFFECT: SettingsEffect = {
	...NO_EFFECT,
	refreshTimelineViews: true,
};

export function getSettingsEffect(key: keyof TimelinePluginSettings): SettingsEffect {
	switch (key) {
		case "timelineFolder":
			return {
				...UI_EFFECT,
				rebuildIndex: true,
			};
		case "propertyEnrichmentEnabled":
		case "dailyNotesMode":
		case "dailyNoteLinkProperty":
			return {
				...NO_EFFECT,
				refreshDayProperties: true,
			};
		case "writeTagsAsObsidianTags":
			return {
				...UI_EFFECT,
				rebuildIndex: true,
				rewriteEntryMarkdown: true,
			};
		case "language":
		case "defaultView":
		case "timeFormat":
		case "renderTimelineContentMarkdown":
		case "showLinkedSourcePreview":
		case "showTimelineCalendar":
		case "timelineDotColor":
		case "timelineLineColor":
			return UI_EFFECT;
		case "attachmentFolder":
		case "fileOrganization":
		case "showMetadataInReadingView":
		case "metadataReadingViewMode":
			return NO_EFFECT;
	}
}

export function mergeSettingsEffects(
	left: SettingsEffect,
	right: SettingsEffect,
): SettingsEffect {
	return {
		refreshTimelineViews:
			left.refreshTimelineViews || right.refreshTimelineViews,
		rebuildIndex: left.rebuildIndex || right.rebuildIndex,
		refreshDayProperties:
			left.refreshDayProperties || right.refreshDayProperties,
		rewriteEntryMarkdown:
			left.rewriteEntryMarkdown || right.rewriteEntryMarkdown,
	};
}
