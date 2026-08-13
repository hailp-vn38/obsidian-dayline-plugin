import { MarkdownView } from "obsidian";

import { t } from "../i18n";
import type DaylinePlugin from "../main";
import { QuickCheckInModal } from "../quick-check-in/QuickCheckInModal";
import { createSourceContextFromView } from "../utils/sourceContext";

export function registerCommands(plugin: DaylinePlugin): void {
	plugin.addRibbonIcon(
		"list-todo",
		t(plugin.settings.language, "timeline.title"),
		() => {
			void plugin.activateTimelineView();
		},
	);
	plugin.addCommand({
		id: "open-timeline",
		name: t(plugin.settings.language, "timeline.title"),
		callback: () => {
			void plugin.activateTimelineView();
		},
	});
	plugin.addCommand({
		id: "create-quick-check-in",
		name: t(plugin.settings.language, "timeline.createCheckIn"),
		callback: () => {
			plugin.openQuickCheckInModal();
		},
	});
	plugin.addCommand({
		id: "create-quick-check-in-from-selection",
		name: t(plugin.settings.language, "command.createCheckInFromSelection"),
		editorCallback: (editor) => {
			new QuickCheckInModal(plugin, {
				initialContent: editor.getSelection(),
			}).open();
		},
	});
	plugin.addCommand({
		id: "create-linked-check-in",
		name: t(plugin.settings.language, "command.createLinkedCheckIn"),
		callback: () => {
			plugin.openLinkedQuickCheckInModal();
		},
	});
	plugin.addCommand({
		id: "create-linked-check-in-from-selection",
		name: t(
			plugin.settings.language,
			"command.createLinkedCheckInFromSelection",
		),
		editorCallback: (editor, view) => {
			const sourceContext = createSourceContextFromView(
				plugin.app,
				view,
				editor,
				"selection",
			);
			new QuickCheckInModal(plugin, {
				initialContent: editor.getSelection(),
				sourceContext,
			}).open();
		},
	});
}

export function getActiveSelection(plugin: DaylinePlugin): string {
	return (
		plugin.app.workspace
			.getActiveViewOfType(MarkdownView)
			?.editor?.getSelection() ?? ""
	);
}
