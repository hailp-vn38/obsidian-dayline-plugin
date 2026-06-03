import React from "react";
import type { TimelineIndexItem } from "../../models/TimelineEntry";
import { getDotClass, getLineClass } from "../../views/timeline/utils/timelineGrouping";
import { ObsidianMarkdown } from "./ObsidianMarkdown";
import { TimelineAttachments } from "./TimelineAttachments";

interface TimelineEntryProps {
	entry: TimelineIndexItem;
	isFirst: boolean;
	isLast: boolean;
	selectedTag: string;
	renderMarkdown: boolean;
	onTagToggle: (tag: string) => void;
	onOpenMenu: (event: React.MouseEvent, item: TimelineIndexItem) => void;
	onTaskToggle: (item: TimelineIndexItem, taskIndex: number, checked: boolean) => void;
}

export const TimelineEntry: React.FC<TimelineEntryProps> = ({
	entry,
	isFirst,
	selectedTag,
	renderMarkdown,
	onTagToggle,
	onOpenMenu,
	onTaskToggle,
}) => {
	const lineClassName = getLineClass(entry);
	const dotClass = getDotClass(entry.type);

	return (
		<div className="pt-entry">
			<div className="pt-rail">
				{!isFirst && <div className={`pt-line pt-line-top ${lineClassName}`} />}
				<div className={`pt-dot ${dotClass}`} />
				<div className={`pt-line pt-line-bottom ${lineClassName}`} />
			</div>

			<div className="pt-entry-main">
				<div className="pt-entry-header">
					<span className="pt-entry-time">{entry.time}</span>
					<div className="pt-entry-header-spacer" />
					<button
						className="pt-entry-menu"
						onClick={(e: React.MouseEvent) => onOpenMenu(e, entry)}
					>
						⋯
					</button>
				</div>

				<ObsidianMarkdown
					markdown={entry.contentMarkdown}
					item={entry}
					renderMarkdown={renderMarkdown}
					onTaskToggle={onTaskToggle}
				/>

				{entry.tags.length > 0 && (
					<div className="pt-entry-tags">
						{entry.tags.map((tag: string) => {
							const normalizedTag = tag.replace(/^#/, "");
							const isActive = selectedTag === normalizedTag;
							return (
								<button
									key={normalizedTag}
									type="button"
									className={`pt-tag${isActive ? " is-active" : ""}`}
									aria-pressed={isActive}
									aria-label={`Filter by #${normalizedTag}`}
									onClick={() => onTagToggle(normalizedTag)}
								>
									#{normalizedTag}
								</button>
							);
						})}
					</div>
				)}

				{entry.attachments.length > 0 && (
					<TimelineAttachments attachments={entry.attachments} />
				)}
			</div>
		</div>
	);
};
