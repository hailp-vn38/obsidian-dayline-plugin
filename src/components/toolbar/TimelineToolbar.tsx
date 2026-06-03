import React from "react";
import type {
	TimelineDatePreset,
	TimelineFilterState,
} from "../../index/filterTimeline";
import { t } from "../../i18n";
import type { TimelineLanguage } from "../../models/TimelineSettings";
import { TimelineFilters } from "./TimelineFilters";
import { TimelineSearch } from "./TimelineSearch";

interface TimelineToolbarProps {
	filters: TimelineFilterState;
	today: string;
	language: TimelineLanguage;
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
	onCustomEndDateChange: (value: string) => void;
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
					aria-label={t(props.language, "common.search")}
					aria-pressed={props.isSearchExpanded}
					onClick={props.onSearchToggle}
				>
					{props.isSearchExpanded
						? t(props.language, "common.closeSearch")
						: t(props.language, "common.search")}
				</button>
				<button
					className="timeline-filter-toggle"
					type="button"
					aria-label={t(props.language, "common.filter")}
					aria-pressed={props.isFilterExpanded}
					onClick={props.onFilterToggle}
				>
					{props.isFilterExpanded
						? t(props.language, "common.closeFilter")
						: t(props.language, "common.filter")}
				</button>
				</div>
			</div>

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
