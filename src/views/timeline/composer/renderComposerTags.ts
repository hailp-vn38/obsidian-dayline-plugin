import { setIcon } from "obsidian";

interface RenderComposerTagsOptions {
	tags: string[];
	availableTags: string[];
	draftValue: string;
	placeholder: string;
	onDraftChange: (value: string) => void;
	onCommitDraft: () => boolean;
	onRemoveTag: (tag: string) => void;
	onAddTag: (tag: string) => void;
	onRefresh: () => void;
}

export function renderComposerTags(
	container: HTMLElement,
	options: RenderComposerTagsOptions,
): void {
	let isComposing = false;
	const tagsRow = container.createDiv({
		cls: "timeline-composer-tags-row",
	});
	const selectedTags = new Set(options.tags);
	const availableTagSuggestions = options.availableTags.filter(
		(tag) => !selectedTags.has(tag),
	);
	if (options.tags.length > 0) {
		tagsRow.addClass("has-selected-tags");
	}
	if (availableTagSuggestions.length > 0) {
		tagsRow.addClass("has-tag-suggestions");
	}
	tagsRow.addClass(
		options.draftValue.trim().length === 0
			? "is-tag-draft-empty"
			: "has-tag-draft",
	);

	const tagsInput = tagsRow.createEl("input", {
		type: "text",
		placeholder: options.placeholder,
	});
	tagsInput.addClass("timeline-composer-tag-input");
	tagsInput.value = options.draftValue;
	tagsInput.addEventListener("compositionstart", () => {
		isComposing = true;
	});
	tagsInput.addEventListener("compositionend", () => {
		isComposing = false;
		options.onDraftChange(tagsInput.value);
	});
	tagsInput.addEventListener("input", () => {
		options.onDraftChange(tagsInput.value);
	});
	tagsInput.addEventListener("keydown", (event) => {
		if (event.isComposing || isComposing) {
			return;
		}

		if (
			event.key === "Enter" ||
			event.key === "," ||
			event.key === " "
		) {
			event.preventDefault();
			if (options.onCommitDraft()) {
				options.onRefresh();
			}
			return;
		}

		if (event.key === "Backspace" && !tagsInput.value && options.tags.length > 0) {
			const lastTag = options.tags[options.tags.length - 1];
			if (lastTag) {
				options.onRemoveTag(lastTag);
				options.onRefresh();
			}
		}
	});

	if (options.tags.length > 0 || availableTagSuggestions.length > 0) {
		const tagsList = tagsRow.createDiv({
			cls: "timeline-composer-tag-list",
		});
		tagsList.setAttribute("aria-label", "Timeline tags");
		for (const tag of options.tags) {
			const chip = tagsList.createDiv({ cls: "timeline-tag-chip" });
			chip.createSpan({
				cls: "timeline-tag-chip-label",
				text: `#${tag}`,
			});
			const removeButton = chip.createEl("button", {
				cls: "timeline-tag-chip-remove",
				attr: { "aria-label": `Remove #${tag}` },
			});
			setIcon(removeButton, "x");
			removeButton.addEventListener("click", () => {
				options.onRemoveTag(tag);
				options.onRefresh();
			});
		}
		for (const tag of availableTagSuggestions) {
			const suggestionButton = tagsList.createEl("button", {
				cls: "timeline-tag-chip timeline-tag-suggestion-chip",
			});
			suggestionButton.type = "button";
			suggestionButton.createSpan({
				cls: "timeline-tag-chip-label",
				text: `#${tag}`,
			});
			suggestionButton.addEventListener("click", () => {
				options.onAddTag(tag);
				options.onRefresh();
			});
		}
	}
}
