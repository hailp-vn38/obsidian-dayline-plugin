import React, { useLayoutEffect, useRef, useState } from "react";
import type {
	ComposerDraftState,
	ComposerFileTypeHint,
	ComposerRecordingState,
} from "../../views/timeline/composer/composerTypes";
import {
	getCommittedComposerTags,
	getComposerTags,
	normalizeComposerContent,
} from "../../views/timeline/composer/composerDraft";
import {
	formatPendingAttachmentSize,
	getPendingAttachmentCardClass,
} from "../../views/timeline/composer/composerAttachments";
import type { PendingQuickAttachment } from "../../views/timeline/composer/pendingAttachments";
import { ObsidianIcon } from "../shared/ObsidianIcon";

interface ComposerPanelProps {
	rootClassName: string;
	contentClassName?: string;
	contentPlaceholder: string;
	tagsPlaceholder: string;
	footerClassName?: string;
	attachmentToolsClassName?: string;
	cancelLabel: string;
	submitLabel: string;
	submitButtonClassName?: string;
	draftState: ComposerDraftState;
	recordingState: ComposerRecordingState;
	availableTags: string[];
	onContentChange: (content: string) => void;
	onTagDraftChange: (tagDraft: string) => void;
	onCommitTagDraft: () => void;
	onRemoveTag: (tag: string) => void;
	onAddTag: (tag: string) => void;
	onRemoveAttachment: (index: number) => void;
	onAddFiles: (files: FileList | File[], typeHint: ComposerFileTypeHint) => void | Promise<void>;
	onToggleRecording: () => void;
	onPaste?: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void | Promise<void>;
	onCancel: () => void;
	onSubmit: () => void | Promise<void>;
}

function syncTextareaHeight(input: HTMLTextAreaElement): void {
	input.style.removeProperty("height");
	input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
}

export const ComposerPanel: React.FC<ComposerPanelProps> = (props) => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const selectedTags = getCommittedComposerTags(props.draftState);
	const unavailableTags = new Set(getComposerTags(props.draftState));
	const availableTagSuggestions = props.availableTags.filter(
		(tag) => !unavailableTags.has(tag),
	);
	const tagRowClassName = [
		"timeline-composer-tags-row",
		selectedTags.length > 0 ? "has-selected-tags" : "",
		availableTagSuggestions.length > 0 ? "has-tag-suggestions" : "",
		props.draftState.tagDraft.trim().length === 0
			? "is-tag-draft-empty"
			: "has-tag-draft",
	]
		.filter(Boolean)
		.join(" ");

	useLayoutEffect(() => {
		if (textareaRef.current) {
			syncTextareaHeight(textareaRef.current);
		}
	}, [props.draftState.content]);

	const onContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		props.onContentChange(e.target.value);
		syncTextareaHeight(e.currentTarget);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
			e.preventDefault();
		}
	};

	const handleSubmit = async () => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		try {
			await props.onSubmit();
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className={props.rootClassName}>
			<textarea
				ref={textareaRef}
				className={props.contentClassName ?? "timeline-composer-content-input"}
				placeholder={props.contentPlaceholder}
				value={normalizeComposerContent(props.draftState.content)}
				onChange={onContentChange}
				onPaste={(event) => {
					void props.onPaste?.(event);
				}}
				onKeyDown={handleKeyDown}
				rows={1}
			/>

			<div className={tagRowClassName}>
				<input
					className="timeline-composer-tag-input"
					type="text"
					placeholder={props.tagsPlaceholder}
					value={props.draftState.tagDraft}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
						props.onTagDraftChange(e.target.value);
					}}
					onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
						if (e.key === "Enter" || e.key === " " || e.key === ",") {
							e.preventDefault();
							props.onCommitTagDraft();
						}
					}}
				/>
				{(selectedTags.length > 0 || availableTagSuggestions.length > 0) && (
					<div className="timeline-composer-tag-list" aria-label="Timeline tags">
						{selectedTags.map((tag: string) => (
							<span key={tag} className="timeline-tag-chip">
								<span className="timeline-tag-chip-label">#{tag}</span>
								<button
									type="button"
									className="timeline-tag-chip-remove"
									aria-label={`Remove #${tag}`}
									onMouseDown={(e: React.MouseEvent) => {
										e.preventDefault();
										props.onRemoveTag(tag);
									}}
								>
									<ObsidianIcon iconId="x" />
								</button>
							</span>
						))}
						{availableTagSuggestions.map((tag: string) => (
							<button
								key={tag}
								type="button"
								className="timeline-tag-chip timeline-tag-suggestion-chip"
								onMouseDown={(e: React.MouseEvent) => {
									e.preventDefault();
									props.onAddTag(tag);
								}}
							>
								<span className="timeline-tag-chip-label">#{tag}</span>
							</button>
						))}
					</div>
				)}
			</div>

			{props.draftState.attachments.length > 0 && (
				<div className="timeline-pending-section">
					<div className="timeline-pending-list timeline-pending-images">
						{props.draftState.attachments.map((att, i) =>
							att.type === "image" ? (
								<PendingAttachmentCard
									key={att.id}
									attachment={att}
									onRemove={() => {
										props.onRemoveAttachment(i);
									}}
								/>
							) : null,
						)}
					</div>
					<div className="timeline-pending-list timeline-pending-files">
						{props.draftState.attachments.map((att, i) =>
							att.type === "file" ? (
								<PendingAttachmentCard
									key={att.id}
									attachment={att}
									onRemove={() => {
										props.onRemoveAttachment(i);
									}}
								/>
							) : null,
						)}
					</div>
					<div className="timeline-pending-list timeline-pending-audios">
						{props.draftState.attachments.map((att, i) =>
							att.type === "audio" ? (
								<PendingAttachmentCard
									key={att.id}
									attachment={att}
									onRemove={() => {
										props.onRemoveAttachment(i);
									}}
								/>
							) : null,
						)}
					</div>
				</div>
			)}

			<div className={props.footerClassName ?? "timeline-composer-footer"}>
				<div className={props.attachmentToolsClassName ?? "timeline-composer-tools"}>
					<button
						className="timeline-icon-button"
						type="button"
						aria-label="Add image"
						onClick={() => imageInputRef.current?.click()}
					>
						<ObsidianIcon iconId="image" />
					</button>
					<button
						className="timeline-icon-button"
						type="button"
						aria-label="Add file"
						onClick={() => fileInputRef.current?.click()}
					>
						<ObsidianIcon iconId="paperclip" />
					</button>
					<button
						className={`timeline-icon-button${props.recordingState.isRecording ? " is-recording" : ""}`}
						type="button"
						aria-label={
							props.recordingState.isRecording
								? "Stop recording"
								: "Record audio"
						}
						onClick={() => props.onToggleRecording()}
					>
						<ObsidianIcon
							iconId={props.recordingState.isRecording ? "square" : "mic"}
						/>
					</button>
					<input
						ref={imageInputRef}
						type="file"
						accept="image/*"
						multiple
						className="timeline-hidden-input"
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
							if (e.target.files) {
								void props.onAddFiles(e.target.files, "image");
							}
							e.target.value = "";
						}}
					/>
					<input
						ref={fileInputRef}
						type="file"
						multiple
						className="timeline-hidden-input"
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
							if (e.target.files) {
								void props.onAddFiles(e.target.files, "file");
							}
							e.target.value = "";
						}}
					/>
				</div>

				<div className="timeline-composer-actions">
					<button
						type="button"
						className="timeline-composer-secondary-button"
						onClick={props.onCancel}
					>
						{props.cancelLabel}
					</button>
					<button
						type="button"
						className={props.submitButtonClassName ?? "mod-cta timeline-composer-submit"}
						onClick={() => {
							void handleSubmit();
						}}
						disabled={isSubmitting}
					>
						<ObsidianIcon iconId="send" />
						{props.submitLabel}
					</button>
				</div>
			</div>
		</div>
	);
};

interface PendingAttachmentCardProps {
	attachment: PendingQuickAttachment;
	onRemove: () => void;
}

const PendingAttachmentCard: React.FC<PendingAttachmentCardProps> = ({
	attachment,
	onRemove,
}) => {
	const name = attachment.name || "Attachment";

	if (attachment.type === "audio") {
		return (
			<div className={`timeline-pending-card ${getPendingAttachmentCardClass(attachment)}`}>
				<div className="timeline-pending-audio-row">
					{attachment.previewUrl && (
						<audio
							className="timeline-pending-audio-player"
							controls
							preload="metadata"
							src={attachment.previewUrl}
						/>
					)}
					<button
						type="button"
						className="timeline-pending-remove is-inline"
						aria-label={`Remove ${name}`}
						onClick={onRemove}
					>
						<ObsidianIcon iconId="x" />
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className={`timeline-pending-card ${getPendingAttachmentCardClass(attachment)}`}>
			{attachment.type === "image" && attachment.previewUrl ? (
				<img
					src={attachment.previewUrl}
					alt={name}
					className="timeline-attachment-image"
				/>
			) : (
				<div className="timeline-pending-file-row">
					<div className="timeline-pending-file-icon">
						<ObsidianIcon iconId="file-down" />
					</div>
					<div className="timeline-pending-file-body">
						<strong className="timeline-pending-file-name">
							{name}
						</strong>
						<div className="timeline-pending-file-size">
							{formatPendingAttachmentSize(
								attachment.data.byteLength,
							)}
						</div>
					</div>
				</div>
			)}
			<button
				type="button"
				className="timeline-pending-remove"
				aria-label={`Remove ${name}`}
				onClick={onRemove}
			>
				<ObsidianIcon iconId="x" />
			</button>
		</div>
	);
};
