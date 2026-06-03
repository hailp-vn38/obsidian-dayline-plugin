import type { TimelinePluginSettings } from "../models/TimelineSettings";

export const DEFAULT_SETTINGS: TimelinePluginSettings = {
	timelineFolder: "Timeline",
	attachmentFolder: "Timeline Attachments",
	fileOrganization: "year-month",
	defaultView: "today",
	timeFormat: "24h",
	renderTimelineContentMarkdown: false,
	timelineDotColor: "",
	timelineLineColor: "",
	showMetadataInReadingView: true,
	metadataReadingViewMode: "summary",
};
