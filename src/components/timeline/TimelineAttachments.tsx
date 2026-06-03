import React, { useEffect, useRef } from "react";
import { TFile } from "obsidian";
import { renderTimelineEntryAttachments } from "../../views/timeline/render/renderTimelineEntryAttachments";
import { usePlugin } from "../../context/PluginContext";
import type { TimelineAttachment } from "../../models/TimelineAttachment";

interface TimelineAttachmentsProps {
	attachments: TimelineAttachment[];
}

export const TimelineAttachments: React.FC<TimelineAttachmentsProps> = ({
	attachments,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const { plugin } = usePlugin();

	useEffect(() => {
		if (containerRef.current && attachments.length > 0) {
			containerRef.current.innerHTML = "";
			renderTimelineEntryAttachments(containerRef.current, attachments, {
				getFileByPath: (path: string) => {
					const abstractFile =
						plugin.app.vault.getAbstractFileByPath(path);
					return abstractFile instanceof TFile ? abstractFile : null;
				},
				getResourcePath: (file: TFile) => {
					return plugin.app.vault.getResourcePath(file);
				},
			});
		}
	}, [attachments, plugin.app]);

	return <div ref={containerRef} className="timeline-attachments" />;
};
