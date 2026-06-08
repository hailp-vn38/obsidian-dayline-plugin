import { Modal, Notice, Setting, TextComponent, setIcon } from "obsidian";

import type DaylinePlugin from "../main";
import type { TimelineAttachment } from "../models/TimelineAttachment";
import type { ParsedTimelineEntry } from "../models/TimelineEntry";
import {
	extractEditableMarkdownContent,
	type TimelineEntryEditInput,
} from "../storage/timelineRepository";
import { parseTags } from "../utils/tags";
import { getErrorMessage } from "../views/timeline/utils/timelineErrors";

export class EditTimelineEntryModal extends Modal {
	private tagsValue: string;
	private contentValue: string;
	private attachmentsValue: TimelineAttachment[];
	private attachmentsEl: HTMLElement | null = null;

	constructor(
		private readonly plugin: DaylinePlugin,
		private readonly sourcePath: string,
		private readonly entry: ParsedTimelineEntry,
	) {
		super(plugin.app);
		this.tagsValue = entry.meta.tags.join(", ");
		this.attachmentsValue = [...entry.meta.attachments];
		this.contentValue = extractEditableMarkdownContent(
			entry.markdown,
			entry.meta.attachments,
			entry.meta.sourceContext,
			entry.meta.tags,
		);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("timeline-edit-modal");

		contentEl.createEl("h2", { text: "Edit timeline entry" });

		const tagsInput = createTextSetting(
			contentEl,
			"Tags",
			this.tagsValue,
			(value) => {
				this.tagsValue = value;
			},
		);
		tagsInput.setPlaceholder("Work, reflection");

		const contentSetting = new Setting(contentEl)
			.setName("Content")
			.setDesc("Edit the Markdown body.");
		const textarea = contentSetting.controlEl.createEl("textarea", {
			cls: "timeline-modal-textarea",
		});
		textarea.value = this.contentValue;
		textarea.addEventListener("input", () => {
			this.contentValue = textarea.value;
		});

		this.attachmentsEl = contentEl.createDiv({
			cls: "timeline-edit-attachments",
		});
		this.renderAttachments();

		const actions = contentEl.createDiv({ cls: "timeline-modal-actions" });
		const saveButton = actions.createEl("button", {
			text: "Save",
			cls: "mod-cta",
		});
		const cancelButton = actions.createEl("button", { text: "Cancel" });

		saveButton.addEventListener("click", () => {
			saveButton.disabled = true;
			void this.handleSave(saveButton);
		});

		cancelButton.addEventListener("click", () => this.close());
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private async handleSave(saveButton: HTMLButtonElement): Promise<void> {
		try {
			const input: TimelineEntryEditInput = {
				content: this.contentValue,
				tags: parseTags(this.tagsValue),
				attachments: this.attachmentsValue,
			};
			await this.plugin.timelineRepository.updateEntry(
				this.sourcePath,
				this.entry.meta.id,
				input,
			);
			await this.plugin.timelineIndex.rebuild();
			await this.plugin.refreshTimelineViews();
			new Notice("Entry updated.");
			this.close();
		} catch (error) {
			new Notice(getErrorMessage(error, "Unable to update entry."));
			saveButton.disabled = false;
		}
	}

	private renderAttachments(): void {
		if (!this.attachmentsEl) {
			return;
		}

		this.attachmentsEl.empty();
		if (this.attachmentsValue.length === 0) {
			return;
		}

		this.attachmentsEl.createDiv({
			cls: "timeline-edit-attachments-label",
			text: "Attachments",
		});
		this.attachmentsEl.createDiv({
			cls: "timeline-edit-attachments-desc",
			text: "Remove attachments from this entry. Files remain in the vault.",
		});

		const listEl = this.attachmentsEl.createDiv({
			cls: "timeline-edit-attachment-list",
		});
		this.attachmentsValue.forEach((attachment) => {
			const rowEl = listEl.createDiv({
				cls: "timeline-edit-attachment-row",
			});
			const iconEl = rowEl.createSpan({
				cls: "timeline-edit-attachment-icon",
			});
			setIcon(iconEl, getAttachmentIcon(attachment));

			const bodyEl = rowEl.createDiv({
				cls: "timeline-edit-attachment-body",
			});
			bodyEl.createDiv({
				cls: "timeline-edit-attachment-name",
				text: attachment.name ?? attachment.path.split("/").pop() ?? attachment.path,
			});
			bodyEl.createDiv({
				cls: "timeline-edit-attachment-path",
				text: attachment.path,
			});

			const removeButton = rowEl.createEl("button", {
				cls: "timeline-edit-attachment-remove",
				attr: {
					"aria-label": `Remove ${attachment.name ?? attachment.path}`,
				},
			});
			setIcon(removeButton, "x");
			removeButton.addEventListener("click", () => {
				this.attachmentsValue = this.attachmentsValue.filter(
					(item) => item.id !== attachment.id,
				);
				this.renderAttachments();
			});
		});
	}
}

function getAttachmentIcon(attachment: TimelineAttachment): string {
	if (attachment.type === "image") {
		return "image";
	}

	if (attachment.type === "audio") {
		return "audio-lines";
	}

	return "paperclip";
}

function createTextSetting(
	container: HTMLElement,
	name: string,
	value: string,
	onChange: (value: string) => void,
): TextComponent {
	let inputRef: TextComponent | null = null;
	const setting = new Setting(container).setName(name);
	setting.addText((text) => {
		inputRef = text;
		text.setValue(value).onChange(onChange);
	});
	if (!inputRef) {
		throw new Error(`Failed to create input for setting: ${name}`);
	}

	return inputRef;
}
