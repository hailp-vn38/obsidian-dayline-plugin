import type { TimelineAttachment, TimelineAttachmentType } from "./TimelineAttachment";

export type TimelineEntryType = "checkin" | "note" | "image" | "audio" | "file" | "mixed";

export type TimelineEntrySource = "manual" | "quick-capture" | "imported";

export type TimelineSourceContextType = "note" | "selection" | "file";

export interface TimelineSourceContext {
	type: TimelineSourceContextType;
	path: string;
	linktext: string;
	subpath?: string;
	display?: string;
	capturedAt: string;
}

export interface TimelineEntryMeta {
	schemaVersion: 1;
	id: string;
	type: TimelineEntryType;
	date: string;
	time: string;
	createdAt: string;
	updatedAt: string;
	tags: string[];
	mood?: string | null;
	source: TimelineEntrySource;
	sourceContext?: TimelineSourceContext;
	attachments: TimelineAttachment[];
}

export interface ParsedTimelineEntry {
	meta: TimelineEntryMeta;
	markdown: string;
	blockStart: number;
	blockEnd: number;
}

export interface TimelineEntryDraft {
	content: string;
	tags: string[];
	type?: TimelineEntryType;
	source?: TimelineEntrySource;
	sourceContext?: TimelineSourceContext;
	attachments?: TimelineAttachment[];
}

export interface TimelineIndexItem {
	id: string;
	type?: TimelineEntryType;
	date: string;
	time: string;
	createdAt: string;
	updatedAt: string;
	tags: string[];
	mood?: string | null;
	attachments: TimelineAttachment[];
	attachmentTypes: TimelineAttachmentType[];
	sourceContext?: TimelineSourceContext;
	hasSourceContext: boolean;
	sourcePath: string;
	blockId: string;
	textPreview: string;
	contentMarkdown: string;
}
