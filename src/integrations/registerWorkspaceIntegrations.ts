import { TFile } from "obsidian";

import { t } from "../i18n";
import type DaylinePlugin from "../main";
import { QuickCheckInModal } from "../quick-check-in/QuickCheckInModal";
import {
	createSourceContext,
	createSourceContextFromView,
} from "../utils/sourceContext";

export function registerWorkspaceIntegrations(plugin: DaylinePlugin): void {
	plugin.registerEvent(plugin.app.workspace.on("file-open", () => {
		void plugin.refreshTimelineViews();
	}));
	plugin.registerEvent(
		plugin.app.workspace.on("editor-menu", (menu, editor, view) => {
			const sourceContext = createSourceContextFromView(
				plugin.app,
				view,
				editor,
				editor.getSelection() ? "selection" : "note",
			);
			if (!sourceContext) {
				return;
			}

			menu.addItem((item) => {
				item
					.setTitle(
						t(plugin.settings.language, "command.addSelectionToDayline"),
					)
					.setIcon("calendar-plus")
					.onClick(() => {
						new QuickCheckInModal(plugin, {
							initialContent: editor.getSelection(),
							sourceContext,
						}).open();
					});
			});
		}),
	);
	plugin.registerEvent(plugin.app.workspace.on("file-menu", (menu, file) => {
		if (!(file instanceof TFile) || file.extension !== "md") {
			return;
		}

		const sourceContext = createSourceContext({
			app: plugin.app,
			file,
			type: "file",
		});
		menu.addItem((item) => {
			item
				.setTitle(t(plugin.settings.language, "command.addFileToDayline"))
				.setIcon("calendar-plus")
				.onClick(() => {
					new QuickCheckInModal(plugin, { sourceContext }).open();
				});
		});
	}));
}
