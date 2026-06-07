import type { TimelineIndexItem } from "../models/TimelineEntry";

export type TimelineDatePreset =
	| "all"
	| "today"
	| "yesterday"
	| "this-week"
	| "custom";

export interface TimelineFilterState {
	searchTerm: string;
	selectedTag: string;
	datePreset: TimelineDatePreset;
	customDate: string;
	customEndDate: string;
}

export function filterTimeline(
	items: TimelineIndexItem[],
	filters: TimelineFilterState,
	today: string,
): TimelineIndexItem[] {
	const yesterday = shiftDate(today, -1);
	const weekDates = new Set(getWeekDates(today));
	const searchQuery = filters.searchTerm.trim().toLowerCase();

	return items
		.filter((item) => matchesDatePreset(item, filters, today, yesterday, weekDates))
		.filter((item) => matchesTag(item, filters.selectedTag))
		.filter((item) => matchesSearch(item, searchQuery))
		.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function matchesDatePreset(
	item: TimelineIndexItem,
	filters: TimelineFilterState,
	today: string,
	yesterday: string,
	weekDates: Set<string>,
): boolean {
	switch (filters.datePreset) {
		case "all":
			return true;
		case "today":
			return item.date === today;
		case "yesterday":
			return item.date === yesterday;
		case "this-week":
			return weekDates.has(item.date);
		case "custom":
			return matchesCustomDateRange(
				item.date,
				filters.customDate,
				filters.customEndDate,
			);
		default:
			return true;
	}
}

function matchesCustomDateRange(
	itemDate: string,
	startDate: string,
	endDate: string,
): boolean {
	if (!startDate && !endDate) {
		return true;
	}

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

function matchesTag(item: TimelineIndexItem, selectedTag: string): boolean {
	if (!selectedTag) {
		return true;
	}

	return item.tags.includes(selectedTag);
}

function matchesSearch(item: TimelineIndexItem, searchQuery: string): boolean {
	if (!searchQuery) {
		return true;
	}

	const haystack = [item.textPreview, item.tags.join(" ")]
		.join(" ")
		.toLowerCase();
	return haystack.includes(searchQuery);
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
