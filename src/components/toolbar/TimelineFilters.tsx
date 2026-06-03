import React from "react";
import type {
	TimelineDatePreset,
	TimelineFilterState,
} from "../../index/filterTimeline";

interface TimelineFiltersProps {
	filters: TimelineFilterState;
	today: string;
	availableTags: string[];
	onDatePresetChange: (preset: TimelineDatePreset) => void;
	onTagChange: (tag: string) => void;
	onCustomDateChange: (value: string) => void;
	onStartTimeChange: (value: string) => void;
	onEndTimeChange: (value: string) => void;
}

export const TimelineFilters: React.FC<TimelineFiltersProps> = (props) => {
	return (
		<>
		<div className="timeline-filter-row">
			<select
				className="timeline-select"
				value={props.filters.datePreset}
				onChange={(e) =>
					props.onDatePresetChange(e.target.value as TimelineDatePreset)
				}
			>
				<option value="today">Today</option>
				<option value="yesterday">Yesterday</option>
				<option value="this-week">This week</option>
				<option value="custom">Custom date</option>
			</select>

			<select
				className="timeline-select"
				value={props.filters.selectedTag}
				onChange={(e) => props.onTagChange(e.target.value)}
			>
				<option value="">All tags</option>
				{props.availableTags.map((tag) => (
					<option key={tag} value={tag}>
						#{tag}
					</option>
				))}
			</select>
		</div>

		<div className="timeline-filter-advanced">
			{props.filters.datePreset === "custom" && (
				<input
					className="timeline-input"
					type="date"
					value={props.filters.customDate}
					onChange={(e) =>
						props.onCustomDateChange(e.target.value || props.today)
					}
				/>
			)}

			<div className="timeline-filter-time-row">
				<input
					className="timeline-input"
					type="time"
					value={props.filters.startTime}
					onChange={(e) => props.onStartTimeChange(e.target.value)}
				/>
				<input
					className="timeline-input"
					type="time"
					value={props.filters.endTime}
					onChange={(e) => props.onEndTimeChange(e.target.value)}
				/>
			</div>
		</div>
		</>
	);
};
