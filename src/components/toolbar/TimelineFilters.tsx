import React from "react";
import type {
	TimelineDatePreset,
	TimelineFilterState,
} from "../../index/filterTimeline";
import { datePresetLabel, t } from "../../i18n";
import type { TimelineLanguage } from "../../models/TimelineSettings";

const DATE_PRESETS: TimelineDatePreset[] = [
	"all",
	"today",
	"yesterday",
	"this-week",
	"custom",
];

interface TimelineFiltersProps {
	filters: TimelineFilterState;
	today: string;
	language: TimelineLanguage;
	availableTags: string[];
	onDatePresetChange: (preset: TimelineDatePreset) => void;
	onTagChange: (tag: string) => void;
	onCustomDateChange: (value: string) => void;
	onCustomEndDateChange: (value: string) => void;
}

export const TimelineFilters: React.FC<TimelineFiltersProps> = (props) => {
	return (
		<div className="timeline-filter-panel">
			<div className="timeline-filter-section">
				<div className="timeline-filter-label">
					{t(props.language, "timeline.filterBy")}
				</div>
				<div className="timeline-filter-chip-row" role="group">
					{DATE_PRESETS.map((preset) => (
						<button
							key={preset}
							type="button"
							className={`timeline-filter-chip${props.filters.datePreset === preset ? " is-active" : ""}`}
							aria-pressed={props.filters.datePreset === preset}
							onClick={() => props.onDatePresetChange(preset)}
						>
							{datePresetLabel(props.language, preset)}
						</button>
					))}
				</div>
			</div>

			{props.filters.datePreset === "custom" && (
				<div className="timeline-filter-advanced">
					<div className="timeline-filter-date-row">
						<input
							className="timeline-input"
							type="date"
							aria-label={t(props.language, "timeline.startDate")}
							value={props.filters.customDate}
							onChange={(e) =>
								props.onCustomDateChange(e.target.value)
							}
						/>
						<input
							className="timeline-input"
							type="date"
							aria-label={t(props.language, "timeline.endDate")}
							value={props.filters.customEndDate}
							onChange={(e) =>
								props.onCustomEndDateChange(e.target.value)
							}
						/>
					</div>
				</div>
			)}

			<div className="timeline-filter-section">
				<div className="timeline-filter-label">
					{t(props.language, "timeline.tagBy")}
				</div>
				<div className="timeline-filter-chip-row" role="group">
					<button
						type="button"
						className={`timeline-filter-chip${props.filters.selectedTag === "" ? " is-active" : ""}`}
						aria-pressed={props.filters.selectedTag === ""}
						onClick={() => props.onTagChange("")}
					>
						{t(props.language, "timeline.allTags")}
					</button>
					{props.availableTags.map((tag) => (
						<button
							key={tag}
							type="button"
							className={`timeline-filter-chip timeline-tag-filter-chip${props.filters.selectedTag === tag ? " is-active" : ""}`}
							aria-pressed={props.filters.selectedTag === tag}
							onClick={() => props.onTagChange(tag)}
						>
							#{tag}
						</button>
					))}
				</div>
			</div>
		</div>
	);
};
