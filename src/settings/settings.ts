import type { TimelinePluginSettings } from "../models/TimelineSettings";

export const DEFAULT_SETTINGS: TimelinePluginSettings = {
	language: "en",
	timelineFolder: "Timeline",
	attachmentFolder: "Timeline Attachments",
	fileOrganization: "year-month",
	defaultView: "today",
	timeFormat: "24h",
	renderTimelineContentMarkdown: false,
	showLinkedSourcePreview: false,
	showTimelineCalendar: false,
	writeTagsAsObsidianTags: false,
	timelineDotColor: "",
	timelineLineColor: "",
	showMetadataInReadingView: true,
	metadataReadingViewMode: "summary",
	propertyEnrichmentEnabled: true,
	dailyNotesMode: "off",
	dailyNoteLinkProperty: "daily_note",
};
