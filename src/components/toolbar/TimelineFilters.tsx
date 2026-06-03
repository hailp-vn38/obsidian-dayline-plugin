import React from "react";
import type {
	TimelineDatePreset,
	TimelineFilterState,
} from "../../index/filterTimeline";
import { datePresetLabel, t } from "../../i18n";
import type { TimelineLanguage } from "../../models/TimelineSettings";

interface TimelineFiltersProps {
	filters: TimelineFilterState;
	today: string;
	language: TimelineLanguage;
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
				<option value="today">
					{datePresetLabel(props.language, "today")}
				</option>
				<option value="yesterday">
					{datePresetLabel(props.language, "yesterday")}
				</option>
				<option value="this-week">
					{datePresetLabel(props.language, "this-week")}
				</option>
				<option value="custom">
					{datePresetLabel(props.language, "custom")}
				</option>
			</select>

			<select
				className="timeline-select"
				value={props.filters.selectedTag}
				onChange={(e) => props.onTagChange(e.target.value)}
			>
				<option value="">{t(props.language, "timeline.allTags")}</option>
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
