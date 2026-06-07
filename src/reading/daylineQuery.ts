import type { TimelineAttachmentType } from "../models/TimelineAttachment";
import type { TimelineIndexItem } from "../models/TimelineEntry";
import { formatDateForFile, getNow } from "../utils/date";

export type DaylineQueryDatePreset =
	| "all"
	| "today"
	| "yesterday"
	| "this-week"
	| "range"
	| "invalid";

export type DaylineQueryAttachmentFilter = TimelineAttachmentType | "any" | "none";

export interface DaylineQuery {
	source?: string;
	tag?: string;
	datePreset: DaylineQueryDatePreset;
	startDate?: string;
	endDate?: string;
	limit: number;
	attachments: DaylineQueryAttachmentFilter;
	warnings: string[];
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parseDaylineQuery(source: string): DaylineQuery {
	const query: DaylineQuery = {
		datePreset: "all",
		limit: DEFAULT_LIMIT,
		attachments: "any",
		warnings: [],
	};

	for (const rawLine of source.split("\n")) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) {
			continue;
		}

		const separatorIndex = line.indexOf(":");
		if (separatorIndex === -1) {
			query.warnings.push(`Ignored line: ${line}`);
			continue;
		}

		const key = line.slice(0, separatorIndex).trim().toLowerCase();
		const value = line.slice(separatorIndex + 1).trim();
		if (!value) {
			continue;
		}

		if (key === "source") {
			query.source = normalizeSourceValue(value);
			continue;
		}

		if (key === "tag") {
			query.tag = value.replace(/^#/, "");
			continue;
		}

		if (key === "date") {
			readDateValue(query, value);
			continue;
		}

		if (key === "limit") {
			query.limit = clampLimit(value);
			continue;
		}

		if (key === "attachments") {
			query.attachments = readAttachmentFilter(value, query.warnings);
			continue;
		}

		query.warnings.push(`Ignored key: ${key}`);
	}

	return query;
}

export function filterItemsForDaylineQuery(
	items: TimelineIndexItem[],
	query: DaylineQuery,
	sourcePath: string,
): TimelineIndexItem[] {
	const today = formatDateForFile(getNow());
	const yesterday = shiftDate(today, -1);
	const weekDates = new Set(getWeekDates(today));

	return items
		.filter((item) => matchesSource(item, query.source, sourcePath))
		.filter((item) => matchesTag(item, query.tag))
		.filter((item) => matchesDate(item.date, query, today, yesterday, weekDates))
		.filter((item) => matchesAttachments(item, query.attachments))
		.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
		.slice(0, query.limit);
}

function readDateValue(query: DaylineQuery, value: string): void {
	if (value === "all" || value === "today" || value === "yesterday" || value === "this-week") {
		query.datePreset = value;
		return;
	}

	if (/^\d{4}-\d{2}-\d{2}\.\.\d{4}-\d{2}-\d{2}$/.test(value)) {
		const [startDate, endDate] = value.split("..");
		query.datePreset = "range";
		query.startDate = startDate;
		query.endDate = endDate;
		return;
	}

	if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		query.datePreset = "range";
		query.startDate = value;
		query.endDate = value;
		return;
	}

	query.datePreset = "invalid";
	query.warnings.push(`Invalid date: ${value}`);
}

function clampLimit(value: string): number {
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed)) {
		return DEFAULT_LIMIT;
	}

	return Math.min(Math.max(parsed, 1), MAX_LIMIT);
}

function readAttachmentFilter(
	value: string,
	warnings: string[],
): DaylineQueryAttachmentFilter {
	if (
		value === "any" ||
		value === "none" ||
		value === "image" ||
		value === "audio" ||
		value === "file"
	) {
		return value;
	}

	warnings.push(`Invalid attachments filter: ${value}`);
	return "any";
}

function matchesSource(
	item: TimelineIndexItem,
	source: string | undefined,
	sourcePath: string,
): boolean {
	if (!source) {
		return true;
	}

	const sourceContext = item.sourceContext;
	if (!sourceContext) {
		return false;
	}

	if (source === "current") {
		return sourceContext.path === sourcePath;
	}

	const target = `${sourceContext.linktext}${sourceContext.subpath ?? ""}`;
	return (
		sourceContext.path === source ||
		sourceContext.linktext === source ||
		target === source ||
		sourceContext.display === source
	);
}

function matchesTag(item: TimelineIndexItem, tag: string | undefined): boolean {
	return !tag || item.tags.includes(tag);
}

function matchesDate(
	itemDate: string,
	query: DaylineQuery,
	today: string,
	yesterday: string,
	weekDates: Set<string>,
): boolean {
	if (query.datePreset === "all") {
		return true;
	}

	if (query.datePreset === "today") {
		return itemDate === today;
	}

	if (query.datePreset === "yesterday") {
		return itemDate === yesterday;
	}

	if (query.datePreset === "this-week") {
		return weekDates.has(itemDate);
	}

	if (query.datePreset === "range") {
		return matchesDateRange(itemDate, query.startDate ?? "", query.endDate ?? "");
	}

	return false;
}

function matchesDateRange(itemDate: string, startDate: string, endDate: string): boolean {
	const rangeStart = startDate && endDate && startDate > endDate ? endDate : startDate;
	const rangeEnd = startDate && endDate && startDate > endDate ? startDate : endDate;

	if (rangeStart && itemDate < rangeStart) {
		return false;
	}

	if (rangeEnd && itemDate > rangeEnd) {
		return false;
	}

	return true;
}

function matchesAttachments(
	item: TimelineIndexItem,
	attachments: DaylineQueryAttachmentFilter,
): boolean {
	if (attachments === "any") {
		return true;
	}

	if (attachments === "none") {
		return item.attachments.length === 0;
	}

	return item.attachmentTypes.includes(attachments);
}

function normalizeSourceValue(value: string): string {
	const wikilinkMatch = /^\[\[(.+?)\]\]$/.exec(value);
	if (!wikilinkMatch) {
		return value;
	}

	return wikilinkMatch[1]?.split("|")[0]?.trim() ?? value;
}

function shiftDate(dateText: string, days: number): string {
	const date = new Date(`${dateText}T00:00:00`);
	date.setDate(date.getDate() + days);
	return [
		date.getFullYear(),
		`${date.getMonth() + 1}`.padStart(2, "0"),
		`${date.getDate()}`.padStart(2, "0"),
	].join("-");
}

function getWeekDates(dateText: string): string[] {
	const date = new Date(`${dateText}T00:00:00`);
	const day = date.getDay();
	const distanceToMonday = day === 0 ? -6 : 1 - day;
	const monday = new Date(date);
	monday.setDate(date.getDate() + distanceToMonday);

	return Array.from({ length: 7 }, (_, index) => {
		const current = new Date(monday);
		current.setDate(monday.getDate() + index);
		return [
			current.getFullYear(),
			`${current.getMonth() + 1}`.padStart(2, "0"),
			`${current.getDate()}`.padStart(2, "0"),
		].join("-");
	});
}
