import React from "react";
import type { TimelineIndexItem } from "../../models/TimelineEntry";
import { TimelineEntry } from "./TimelineEntry";
import { groupEntriesByDate } from "../../views/timeline/utils/timelineGrouping";
import { dayHeader } from "../../i18n";
import type { TimelineLanguage } from "../../models/TimelineSettings";

interface TimelineListProps {
	items: TimelineIndexItem[];
	today: string;
	language: TimelineLanguage;
	selectedTag: string;
	renderMarkdown: boolean;
	showLinkedSourcePreview: boolean;
	onTagToggle: (tag: string) => void;
	onOpenSource: (item: TimelineIndexItem) => void;
	onOpenMenu: (event: React.MouseEvent, item: TimelineIndexItem) => void;
	onTaskToggle: (
		item: TimelineIndexItem,
		taskIndex: number,
		checked: boolean,
	) => void;
}

export const TimelineList: React.FC<TimelineListProps> = React.memo(({
	items,
	today,
	language,
	selectedTag,
	renderMarkdown,
	showLinkedSourcePreview,
	onTagToggle,
	onOpenSource,
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
							language={language}
							selectedTag={selectedTag}
							renderMarkdown={renderMarkdown}
							showLinkedSourcePreview={showLinkedSourcePreview}
							onTagToggle={onTagToggle}
							onOpenSource={onOpenSource}
							onOpenMenu={onOpenMenu}
							onTaskToggle={onTaskToggle}
						/>
					);
				});

				return (
					<div key={dateStr} className="pt-day-group">
						<div className="pt-day-header">
							{dayHeader(language, dateStr, today)}
						</div>
						<div className="pt-timeline">
							{dayEntries}
						</div>
					</div>
				);
			})}
		</div>
	);
});
