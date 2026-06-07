import React from "react";
import type {
	TimelineDatePreset,
	TimelineFilterState,
} from "../../index/filterTimeline";
import type { TimelineLanguage } from "../../models/TimelineSettings";
import { TimelineFilters } from "./TimelineFilters";
import { TimelineSearch } from "./TimelineSearch";

interface TimelineToolbarProps {
	filters: TimelineFilterState;
	today: string;
	language: TimelineLanguage;
	isSearchExpanded: boolean;
	isFilterExpanded: boolean;
	availableTags: string[];
	onSearchInput: (value: string) => void;
	onDatePresetChange: (preset: TimelineDatePreset) => void;
	onTagChange: (tag: string) => void;
	onCustomDateChange: (value: string) => void;
	onCustomEndDateChange: (value: string) => void;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = (props) => {
	if (!props.isSearchExpanded && !props.isFilterExpanded) {
		return null;
	}

	return (
		<div className="timeline-action-panel">
			{props.isSearchExpanded && (
				<TimelineSearch
					language={props.language}
					value={props.filters.searchTerm}
					onSearchInput={props.onSearchInput}
				/>
			)}

			{props.isFilterExpanded && (
				<TimelineFilters
					filters={props.filters}
					today={props.today}
					language={props.language}
					availableTags={props.availableTags}
					onDatePresetChange={props.onDatePresetChange}
					onTagChange={props.onTagChange}
					onCustomDateChange={props.onCustomDateChange}
					onCustomEndDateChange={props.onCustomEndDateChange}
				/>
			)}
		</div>
	);
};
