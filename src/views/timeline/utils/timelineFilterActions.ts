import type {
	TimelineDatePreset,
	TimelineFilterState,
} from "../../../index/filterTimeline";

export function resetExpandedFilters(
	filters: TimelineFilterState,
	today: string,
): void {
	filters.datePreset = "today";
	filters.customDate = today;
	filters.customEndDate = today;
	filters.selectedTag = "";
	filters.sourceMode = "all";
}

export function updateDatePreset(
	filters: TimelineFilterState,
	preset: TimelineDatePreset,
	today: string,
): void {
	filters.datePreset = preset;
	if (preset === "today" || preset === "all") {
		filters.customDate = today;
		filters.customEndDate = today;
	}
	if (preset === "custom" && !filters.customDate) {
		filters.customDate = today;
	}
	if (preset === "custom" && !filters.customEndDate) {
		filters.customEndDate = filters.customDate || today;
	}
}
