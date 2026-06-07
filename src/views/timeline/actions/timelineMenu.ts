import { Menu } from "obsidian";

import { t } from "../../../i18n";
import type { TimelineIndexItem } from "../../../models/TimelineEntry";
import type { TimelineLanguage } from "../../../models/TimelineSettings";
import type { TimelineEntryActions } from "./timelineEntryActions";

export function openTimelineEntryMenu(
	event: MouseEvent,
	item: TimelineIndexItem,
	actions: TimelineEntryActions,
	language: TimelineLanguage,
): void {
	const menu = new Menu();
	menu.addItem((menuItem) =>
		menuItem
			.setTitle("Edit")
			.setIcon("pencil")
			.onClick(() => {
				void actions.edit(item);
			}),
	);
	menu.addItem((menuItem) =>
		menuItem
			.setTitle("Duplicate")
			.setIcon("copy")
			.onClick(() => {
				void actions.duplicate(item);
			}),
	);
	menu.addItem((menuItem) =>
		menuItem
			.setTitle("Open source")
			.setIcon("external-link")
			.onClick(() => {
				void actions.openSource(item);
			}),
	);
	if (item.sourceContext) {
		menu.addItem((menuItem) =>
			menuItem
				.setTitle(t(language, "menu.openLinkedSource"))
				.setIcon("link")
				.onClick(() => {
					void actions.openLinkedSource(item);
				}),
		);
	}
	menu.addSeparator();
	menu.addItem((menuItem) =>
		menuItem
			.setTitle("Delete")
			.setIcon("trash")
			.onClick(() => {
				void actions.delete(item);
			}),
	);
	menu.showAtMouseEvent(event);
}
