import { MarkdownRenderChild, setIcon, TFile, type MarkdownPostProcessorContext } from "obsidian";

import type DaylinePlugin from "../main";
import type { TimelineIndexItem } from "../models/TimelineEntry";
import { getSourceContextLabel } from "../utils/sourceContext";
import { filterItemsForDaylineQuery, parseDaylineQuery } from "./daylineQuery";

export function renderDaylineCodeBlock(
	plugin: DaylinePlugin,
	source: string,
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext,
): void {
	const component = new MarkdownRenderChild(el);
	ctx.addChild(component);
	el.empty();
	el.addClass("dayline-embed");

	const query = parseDaylineQuery(source);
	const items = filterItemsForDaylineQuery(
		plugin.timelineIndex.getAll(),
		query,
		ctx.sourcePath,
	);

	if (query.warnings.length > 0) {
		const warningEl = el.createDiv({ cls: "dayline-embed-warning" });
		warningEl.setText(query.warnings.join(" · "));
	}

	if (items.length === 0) {
		el.createDiv({
			cls: "dayline-embed-empty",
			text: "No Dayline entries match this query.",
		});
		return;
	}

	const listEl = el.createDiv({ cls: "dayline-embed-list" });
	for (const item of items) {
		renderEmbedItem(plugin, component, listEl, item);
	}
}

function renderEmbedItem(
	plugin: DaylinePlugin,
	component: MarkdownRenderChild,
	container: HTMLElement,
	item: TimelineIndexItem,
): void {
	const entryEl = container.createDiv({ cls: "dayline-embed-entry" });
	const headerEl = entryEl.createDiv({ cls: "dayline-embed-entry-header" });
	const metaEl = headerEl.createDiv({ cls: "dayline-embed-entry-meta" });
	metaEl.createSpan({
		cls: "dayline-embed-entry-date",
		text: item.date,
	});
	metaEl.createSpan({
		cls: "dayline-embed-entry-time",
		text: item.time,
	});

	if (item.sourceContext) {
		const sourceButton = metaEl.createEl("button", {
			cls: "dayline-embed-source",
			attr: {
				"aria-label": `Open ${getSourceContextLabel(item.sourceContext)}`,
				type: "button",
			},
		});
		const sourceIcon = sourceButton.createSpan({ cls: "dayline-embed-button-icon" });
		setIcon(sourceIcon, "link");
		sourceButton.createSpan({
			cls: "dayline-embed-source-label",
			text: getSourceContextLabel(item.sourceContext),
		});
		component.registerDomEvent(sourceButton, "click", () => {
			if (item.sourceContext) {
				void plugin.openSourceContext(item.sourceContext);
			}
		});
	}

	const actionsEl = headerEl.createDiv({ cls: "dayline-embed-entry-actions" });
	const openButton = actionsEl.createEl("button", {
		cls: "dayline-embed-open",
		attr: {
			"aria-label": "Open timeline entry",
			type: "button",
		},
	});
	const openIcon = openButton.createSpan({ cls: "dayline-embed-button-icon" });
	setIcon(openIcon, "external-link");
	openButton.createSpan({ text: "Open entry" });
	component.registerDomEvent(openButton, "click", () => {
		const file = plugin.app.vault.getAbstractFileByPath(item.sourcePath);
		if (file instanceof TFile) {
			void plugin.openTimelineSource(file, item.id);
		}
	});

	const body = item.contentMarkdown.trim() || item.textPreview.trim();
	if (body) {
		entryEl.createDiv({ cls: "dayline-embed-entry-body", text: body });
	}

	if (item.tags.length > 0) {
		const tagsEl = entryEl.createDiv({ cls: "dayline-embed-tags" });
		for (const tag of item.tags) {
			tagsEl.createSpan({ cls: "dayline-embed-tag", text: `#${tag}` });
		}
	}
}
