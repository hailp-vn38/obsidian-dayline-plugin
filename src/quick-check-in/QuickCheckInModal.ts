import { Modal, Notice, setIcon } from "obsidian";

import type DaylinePlugin from "../main";
import type { TimelineSourceContext } from "../models/TimelineEntry";
import { getSourceContextLabel } from "../utils/sourceContext";
import { canCreateQuickCheckIn } from "../utils/tags";
import {
	appendPendingFiles,
	appendPastedImages,
	mapPendingAttachmentsToInputs,
	releasePendingAttachmentPreviews,
} from "../views/timeline/composer/composerAttachments";
import {
	clearComposerDraft,
	commitComposerTagDraft,
	getComposerTags,
	removeComposerTag,
} from "../views/timeline/composer/composerDraft";
import {
	startComposerRecording,
	stopComposerRecording,
	stopComposerRecordingTracks,
} from "../views/timeline/composer/composerRecording";
import { renderComposerPanel } from "../views/timeline/composer/renderComposerPanel";
import type {
	ComposerDraftState,
	ComposerRecordingState,
} from "../views/timeline/composer/composerTypes";
import { t } from "../i18n";

interface QuickCheckInModalOptions {
	initialContent?: string;
	sourceContext?: TimelineSourceContext | null;
}

export class QuickCheckInModal extends Modal {
	private readonly draftState: ComposerDraftState = {
		content: "",
		tagsValue: "",
		tagDraft: "",
		attachments: [],
	};
	private readonly recordingState: ComposerRecordingState = {
		mediaRecorder: null,
		audioChunks: [],
		isRecording: false,
	};
	private readonly sourceContext?: TimelineSourceContext;
	private contentTextarea!: HTMLTextAreaElement;

	constructor(
		private readonly plugin: DaylinePlugin,
		options?: QuickCheckInModalOptions,
	) {
		super(plugin.app);
		this.draftState.content = options?.initialContent ?? "";
		this.sourceContext = options?.sourceContext ?? undefined;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("pt-checkin-modal");

		contentEl.createEl("h2", { text: "Quick check-in" });
		this.renderSourceContext();
		this.contentTextarea = renderComposerPanel(contentEl, {
			rootClassName: "pt-checkin-modal-body timeline-composer",
			contentClassName:
				"pt-checkin-modal-content timeline-composer-content-input",
			contentPlaceholder: t(
				this.plugin.settings.language,
				"timeline.contentPlaceholder",
			),
			tagsPlaceholder: t(
				this.plugin.settings.language,
				"timeline.tagsPlaceholder",
			),
			footerClassName: "pt-checkin-modal-footer timeline-composer-footer",
			attachmentToolsClassName:
				"pt-checkin-modal-actions timeline-composer-tools",
			cancelLabel: "Cancel",
			submitLabel: "Create",
			draftState: this.draftState,
			recordingState: this.recordingState,
			onDraftRefresh: () => {
				this.redraw();
			},
			onCommitTagDraft: () => this.commitTagDraft(),
			onRemoveTag: (tag) => {
				this.removeTag(tag);
			},
			onAddFiles: async (files, typeHint) => {
				await this.addPendingFiles(files, typeHint);
			},
			onPaste: async (event) => {
				await this.pasteImages(event);
			},
			onToggleRecording: () => {
				if (this.recordingState.isRecording) {
					this.stopRecording();
					return;
				}

				void this.startRecording();
			},
			onCancel: () => {
				this.close();
			},
			onSubmit: async () => {
				await this.submit();
			},
			onSubmitShortcut: async () => {
				await this.submit();
			},
		});

		window.setTimeout(() => {
			this.contentTextarea.focus();
			if (this.contentTextarea.value.length > 0) {
				this.contentTextarea.setSelectionRange(this.contentTextarea.value.length, this.contentTextarea.value.length);
			}
		}, 0);
	}

	onClose(): void {
		this.stopRecordingTracks();
		this.releasePreviewUrls();
		clearComposerDraft(this.draftState);
		this.contentEl.empty();
	}

	private async submit(): Promise<void> {
		const content = this.draftState.content.trim();
		this.commitTagDraft();
		const tags = this.getTags();
		if (!canCreateQuickCheckIn(content, tags, this.draftState.attachments)) {
			new Notice("Nothing to save.");
			return;
		}

		await this.plugin.createQuickCheckIn({
			content,
			tags,
			attachments: mapPendingAttachmentsToInputs(this.draftState.attachments),
			source: "quick-capture",
			sourceContext: this.sourceContext,
		});
		new Notice("Timeline check-in created.");
		this.close();
	}

	private renderSourceContext(): void {
		if (!this.sourceContext) {
			return;
		}

		const sourceContext = this.sourceContext;
		const sourceEl = this.contentEl.createDiv({
			cls: "pt-checkin-source",
		});
		const iconEl = sourceEl.createSpan({
			cls: "pt-checkin-source-icon",
		});
		setIcon(iconEl, "link");

		const bodyEl = sourceEl.createDiv({
			cls: "pt-checkin-source-body",
		});
		bodyEl.createDiv({
			cls: "pt-checkin-source-label",
			text: t(this.plugin.settings.language, "timeline.linkedSource"),
		});

		const linkButton = bodyEl.createEl("button", {
			cls: "pt-checkin-source-link",
			text: getSourceContextLabel(sourceContext),
		});
		linkButton.type = "button";
		linkButton.addEventListener("click", () => {
			void this.plugin.openSourceContext(sourceContext);
		});
	}

	private async addPendingFiles(files: File[], typeHint: "image" | "file"): Promise<void> {
		await appendPendingFiles(this.draftState.attachments, files, typeHint);
		this.redraw();
	}

	private async pasteImages(event: ClipboardEvent): Promise<void> {
		const hasPastedImages = await appendPastedImages(
			this.draftState.attachments,
			event,
		);
		if (hasPastedImages) {
			this.redraw();
		}
	}

	private async startRecording(): Promise<void> {
		await startComposerRecording({
			state: this.recordingState,
			onUnsupported: () => {
				new Notice("Audio recording is not supported in this environment.");
			},
			onError: () => {
				new Notice("Unable to start audio recording.");
			},
			onReady: async (file) => {
				await this.finishRecording(file);
			},
			onStateChanged: async () => {
				this.redraw();
			},
		});
	}

	private stopRecording(): void {
		stopComposerRecording(this.recordingState);
	}

	private async finishRecording(file: File): Promise<void> {
		await appendPendingFiles(this.draftState.attachments, [file], "audio");
		this.redraw();
	}

	private stopRecordingTracks(): void {
		stopComposerRecordingTracks(this.recordingState);
	}

	private releasePreviewUrls(): void {
		releasePendingAttachmentPreviews(this.draftState.attachments);
	}

	private getTags(): string[] {
		return getComposerTags(this.draftState);
	}

	private commitTagDraft(): boolean {
		return commitComposerTagDraft(this.draftState);
	}

	private removeTag(tagToRemove: string): void {
		removeComposerTag(this.draftState, tagToRemove);
	}

	private redraw(): void {
		this.onOpen();
	}
}
