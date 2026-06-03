import React from "react";
import type { TimelineIndexItem } from "../../models/TimelineEntry";
import { TimelineEntry } from "./TimelineEntry";
import { groupEntriesByDate } from "../../views/timeline/utils/timelineGrouping";
import { formatDayHeader } from "../../views/timeline/utils/timelineDates";

interface TimelineListProps {
	items: TimelineIndexItem[];
	today: string;
	selectedTag: string;
	onTagToggle: (tag: string) => void;
	onOpenMenu: (event: React.MouseEvent, item: TimelineIndexItem) => void;
	onTaskToggle: (
		item: TimelineIndexItem,
		taskIndex: number,
		checked: boolean,
	) => void;
}

export const TimelineList: React.FC<TimelineListProps> = ({
	items,
	today,
	selectedTag,
	onTagToggle,
	onOpenMenu,
	onTaskToggle,
}) => {
	const grouped = groupEntriesByDate(items);

	let renderedEntryCount = 0;

	return (
		<div className="pt-timeline-list">
			{grouped.map(([dateStr, dayItems]) => {
				const dayEntries = dayItems.map((item: TimelineIndexItem) => {
					const isFirst = renderedEntryCount === 0;
					const isLast = renderedEntryCount === items.length - 1;
					renderedEntryCount++;

					return (
						<TimelineEntry
							key={item.id}
							entry={item}
							isFirst={isFirst}
							isLast={isLast}
							selectedTag={selectedTag}
							onTagToggle={onTagToggle}
							onOpenMenu={onOpenMenu}
							onTaskToggle={onTaskToggle}
						/>
					);
				});

				return (
					<div key={dateStr} className="pt-day-group">
						<div className="pt-day-header">
							{formatDayHeader(dateStr, today)}
						</div>
						<div className="pt-timeline">
							{dayEntries}
						</div>
					</div>
				);
			})}
		</div>
	);
};
