import React, { useCallback } from "react";
import type { TimelineIndexItem } from "../../models/TimelineEntry";
import { useMarkdown } from "../../hooks/useMarkdown";

interface ObsidianMarkdownProps {
	markdown: string;
	item: TimelineIndexItem;
	onTaskToggle: (
		item: TimelineIndexItem,
		taskIndex: number,
		checked: boolean,
	) => void;
}

export const ObsidianMarkdown: React.FC<ObsidianMarkdownProps> = ({
	markdown,
	item,
	onTaskToggle,
}) => {
	const handleRendered = useCallback(
		(container: HTMLElement) => {
			Array.from(
				container.querySelectorAll<HTMLInputElement>(
					'input.task-list-item-checkbox[type="checkbox"]',
				),
			).forEach((checkbox, taskIndex) => {
				checkbox.addEventListener("change", () => {
					onTaskToggle(item, taskIndex, checkbox.checked);
				});
			});
		},
		[item, onTaskToggle],
	);
	const containerRef = useMarkdown({
		markdown,
		sourcePath: item.sourcePath,
		onRendered: handleRendered,
	});

	if (!markdown.trim() && item.textPreview) {
		return <div className="pt-entry-body">{item.textPreview}</div>;
	}

	return (
		<div ref={containerRef} className="pt-entry-body markdown-rendered" />
	);
};
