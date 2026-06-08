import React from "react";
import type { TimelineIndexItem } from "../../models/TimelineEntry";
import type { TimelineLanguage } from "../../models/TimelineSettings";
import { getDotClass, getLineClass } from "../../views/timeline/utils/timelineGrouping";
import { getSourceContextLabel } from "../../utils/sourceContext";
import { ObsidianIcon } from "../shared/ObsidianIcon";
import { ObsidianMarkdown } from "./ObsidianMarkdown";
import { LinkedSourcePreview } from "./LinkedSourcePreview";
import { TimelineAttachments } from "./TimelineAttachments";

interface TimelineEntryProps {
	entry: TimelineIndexItem;
	isFirst: boolean;
	isLast: boolean;
	language: TimelineLanguage;
	selectedTag: string;
	renderMarkdown: boolean;
	showLinkedSourcePreview: boolean;
	refreshRevision: number;
	onTagToggle: (tag: string) => void;
	onOpenSource: (item: TimelineIndexItem) => void;
	onOpenMenu: (event: React.MouseEvent, item: TimelineIndexItem) => void;
	onTaskToggle: (item: TimelineIndexItem, taskIndex: number, checked: boolean) => void;
}

export const TimelineEntry: React.FC<TimelineEntryProps> = ({
	entry,
	isFirst,
	language,
	selectedTag,
	renderMarkdown,
	showLinkedSourcePreview,
	refreshRevision,
	onTagToggle,
	onOpenSource,
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

				{entry.sourceContext && (
					<button
						type="button"
						className="pt-source-chip"
						aria-label={`Open ${getSourceContextLabel(entry.sourceContext)}`}
						onClick={() => onOpenSource(entry)}
					>
						<ObsidianIcon iconId="link" />
						<span>{getSourceContextLabel(entry.sourceContext)}</span>
					</button>
				)}

				{entry.sourceContext && showLinkedSourcePreview && (
					<LinkedSourcePreview
						entry={entry}
						language={language}
						refreshRevision={refreshRevision}
						onOpenSource={onOpenSource}
					/>
				)}

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
