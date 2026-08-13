import React, { useEffect, useRef } from "react";
import { TFile } from "obsidian";
import { renderTimelineEntryAttachments } from "../../views/timeline/render/renderTimelineEntryAttachments";
import { usePlugin } from "../../context/PluginContext";
import type { TimelineAttachment } from "../../models/TimelineAttachment";
import { ImagePreviewModal } from "../../modals/ImagePreviewModal";

interface TimelineAttachmentsProps {
	attachments: TimelineAttachment[];
}

export const TimelineAttachments: React.FC<TimelineAttachmentsProps> = ({
	attachments,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const { plugin } = usePlugin();

	useEffect(() => {
		const container = containerRef.current;
		if (container && attachments.length > 0) {
			container.innerHTML = "";
			renderTimelineEntryAttachments(container, attachments, {
				getFileByPath: (path: string) => {
					const abstractFile =
						plugin.app.vault.getAbstractFileByPath(path);
					return abstractFile instanceof TFile ? abstractFile : null;
				},
				getResourcePath: (file: TFile) => {
					return plugin.app.vault.getResourcePath(file);
				},
				onImageClick: (attachment, file) => {
					new ImagePreviewModal(
						plugin.app,
						file,
						plugin.app.vault.getResourcePath(file),
						attachment.name ?? file.name,
					).open();
				},
			});
		}
		return () => container?.empty();
	}, [attachments, plugin.app]);

	return <div ref={containerRef} className="timeline-attachments" />;
};
