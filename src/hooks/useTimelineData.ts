import { useMemo } from "react";

import {
	filterTimeline,
	type TimelineFilterState,
} from "../index/filterTimeline";
import { usePlugin } from "../context/PluginContext";
import { formatDateForFile, getNow } from "../utils/date";
import { shiftDate } from "../views/timeline/utils/timelineDates";
import { useTags } from "./useTags";

interface UseTimelineDataOptions {
	filters: TimelineFilterState;
	refreshRevision: number;
	uiRevision: number;
}

export function useTimelineData({
	filters,
	refreshRevision,
	uiRevision,
}: UseTimelineDataOptions) {
	const { plugin } = usePlugin();
	void refreshRevision;
	void uiRevision;

	const allItems = plugin.timelineIndex.getAll();
	const availableTags = useTags();
	const malformedEntryCount = plugin.timelineIndex.getMalformedEntryCount();
	const today = formatDateForFile(getNow());

	const filteredItems = useMemo(
		() => filterTimeline(allItems, filters, today),
		[allItems, filters, today],
	);

	const activeDate = useMemo(() => {
		if (filters.datePreset === "custom") {
			if (!filters.customDate) return filters.customEndDate;
			if (!filters.customEndDate || filters.customDate === filters.customEndDate) {
				return filters.customDate;
			}
			return `${filters.customDate} - ${filters.customEndDate}`;
		}
		if (filters.datePreset === "today") return today;
		if (filters.datePreset === "yesterday") return shiftDate(today, -1);
		if (filters.datePreset === "this-week") return today;
		return today;
	}, [filters, today]);

	return {
		allItems,
		availableTags,
		malformedEntryCount,
		today,
		filteredItems,
		activeDate,
	};
}
