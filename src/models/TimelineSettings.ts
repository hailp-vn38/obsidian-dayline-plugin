export type TimelineFileOrganization = "flat" | "year" | "year-month";
export type TimelineDefaultView = "today" | "last-opened";
export type TimelineTimeFormat = "12h" | "24h";
export type TimelineMetadataReadingViewMode = "summary" | "table" | "json";

export interface TimelinePluginSettings {
	timelineFolder: string;
	attachmentFolder: string;
	fileOrganization: TimelineFileOrganization;
	defaultView: TimelineDefaultView;
	timeFormat: TimelineTimeFormat;
	renderTimelineContentMarkdown: boolean;
	timelineDotColor: string;
	timelineLineColor: string;
	showMetadataInReadingView: boolean;
	metadataReadingViewMode: TimelineMetadataReadingViewMode;
}
