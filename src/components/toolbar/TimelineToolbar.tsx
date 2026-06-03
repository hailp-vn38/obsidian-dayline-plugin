import React from "react";
import type {
	TimelineDatePreset,
	TimelineFilterState,
} from "../../index/filterTimeline";
import { TimelineFilters } from "./TimelineFilters";
import { TimelineSearch } from "./TimelineSearch";

interface TimelineToolbarProps {
	filters: TimelineFilterState;
	today: string;
	summaryText: string;
	isSearchExpanded: boolean;
	isFilterExpanded: boolean;
	availableTags: string[];
	onSearchToggle: () => void;
	onFilterToggle: () => void;
	onSearchInput: (value: string) => void;
	onDatePresetChange: (preset: TimelineDatePreset) => void;
	onTagChange: (tag: string) => void;
	onCustomDateChange: (value: string) => void;
	onStartTimeChange: (value: string) => void;
	onEndTimeChange: (value: string) => void;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = (props) => {
	return (
		<div className="timeline-toolbar">
			<div className="timeline-toolbar-row">
				<div className="timeline-toolbar-summary">
					{props.summaryText}
				</div>
				<div className="timeline-toolbar-controls">
				<button
					className="timeline-filter-toggle"
					type="button"
					aria-label="Toggle search"
					aria-pressed={props.isSearchExpanded}
					onClick={props.onSearchToggle}
				>
					{props.isSearchExpanded ? "Close search" : "Search"}
				</button>
				<button
					className="timeline-filter-toggle"
					type="button"
					aria-label="Toggle filter"
					aria-pressed={props.isFilterExpanded}
					onClick={props.onFilterToggle}
				>
					{props.isFilterExpanded ? "Close filter" : "Filter"}
				</button>
				</div>
			</div>

			{props.isSearchExpanded && (
				<TimelineSearch
					value={props.filters.searchTerm}
					onSearchInput={props.onSearchInput}
				/>
			)}

			{props.isFilterExpanded && (
				<TimelineFilters
					filters={props.filters}
					today={props.today}
					availableTags={props.availableTags}
					onDatePresetChange={props.onDatePresetChange}
					onTagChange={props.onTagChange}
					onCustomDateChange={props.onCustomDateChange}
					onStartTimeChange={props.onStartTimeChange}
					onEndTimeChange={props.onEndTimeChange}
				/>
			)}
		</div>
	);
};
