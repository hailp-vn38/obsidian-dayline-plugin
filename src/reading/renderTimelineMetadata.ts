import { TFile, type MarkdownPostProcessorContext } from "obsidian";

import type DaylinePlugin from "../main";
import type { ParsedTimelineEntry, TimelineEntryMeta } from "../models/TimelineEntry";
import type { TimelineMetadataReadingViewMode } from "../models/TimelineSettings";
import { parseTimelineEntries } from "../parser/parseTimelineEntries";
import { isTimelineMarkdownPath } from "../utils/timelinePath";

interface CachedReadingEntry {
	entry: ParsedTimelineEntry;
	lineStart: number;
}

interface ReadingCacheSlot {
	mtime: number;
	entries: Promise<CachedReadingEntry[]>;
}

const readingCache = new WeakMap<
	DaylinePlugin,
	Map<string, ReadingCacheSlot>
>();

export async function renderTimelineMetadataInReadingView(
	plugin: DaylinePlugin,
	rootEl: HTMLElement,
	ctx: MarkdownPostProcessorContext,
): Promise<void> {
	if (!plugin.settings.showMetadataInReadingView) {
		return;
	}

	const file = plugin.app.vault.getAbstractFileByPath(ctx.sourcePath);
	if (!(file instanceof TFile) || file.extension !== "md") {
		return;
	}

	if (!isTimelineMarkdownPath(ctx.sourcePath, plugin.settings.timelineFolder)) {
		return;
	}

	const cachedEntries = await getCachedReadingEntries(plugin, file);
	const section = ctx.getSectionInfo(rootEl);
	const entries = cachedEntries
		.filter(({ lineStart }) =>
			section
				? lineStart >= section.lineStart && lineStart <= section.lineEnd
				: true,
		)
		.map(({ entry }) => entry);
	if (!entries.length) {
		return;
	}

	injectTimelineMetadataUi(rootEl, entries, plugin.settings.metadataReadingViewMode);
}

export function invalidateTimelineMetadataCache(
	plugin: DaylinePlugin,
	path?: string,
): void {
	const pluginCache = readingCache.get(plugin);
	if (!pluginCache) {
		return;
	}

	if (path) {
		pluginCache.delete(path);
		return;
	}

	pluginCache.clear();
}

export async function readTimelineMetadataEntries(
	plugin: DaylinePlugin,
	file: TFile,
): Promise<ParsedTimelineEntry[]> {
	return (await getCachedReadingEntries(plugin, file)).map(({ entry }) => entry);
}

async function getCachedReadingEntries(
	plugin: DaylinePlugin,
	file: TFile,
): Promise<CachedReadingEntry[]> {
	let pluginCache = readingCache.get(plugin);
	if (!pluginCache) {
		pluginCache = new Map<string, ReadingCacheSlot>();
		readingCache.set(plugin, pluginCache);
	}

	const cached = pluginCache.get(file.path);
	if (cached?.mtime === file.stat.mtime) {
		return cached.entries;
	}

	const entries = plugin.app.vault.cachedRead(file).then((markdown) => {
		if (!isTimelineMarkdown(markdown)) {
			return [];
		}

		const lineStarts = getLineStarts(markdown);
		return parseTimelineEntries(markdown).map((entry) => ({
			entry,
			lineStart: getLineAtOffset(lineStarts, entry.blockStart),
		}));
	});
	pluginCache.set(file.path, {
		mtime: file.stat.mtime,
		entries,
	});

	try {
		return await entries;
	} catch (error) {
		const latest = pluginCache.get(file.path);
		if (latest?.entries === entries) {
			pluginCache.delete(file.path);
		}
		throw error;
	}
}

function isTimelineMarkdown(markdown: string): boolean {
	return /^---[\s\S]*?type:\s*timeline-day[\s\S]*?---/.test(markdown);
}

function getLineStarts(markdown: string): number[] {
	const starts = [0];
	for (let index = 0; index < markdown.length; index += 1) {
		if (markdown[index] === "\n") {
			starts.push(index + 1);
		}
	}
	return starts;
}

function getLineAtOffset(lineStarts: number[], offset: number): number {
	let low = 0;
	let high = lineStarts.length - 1;
	while (low <= high) {
		const middle = Math.floor((low + high) / 2);
		const lineStart = lineStarts[middle] ?? 0;
		if (lineStart <= offset) {
			low = middle + 1;
		} else {
			high = middle - 1;
		}
	}
	return Math.max(high, 0);
}

function injectTimelineMetadataUi(
	rootEl: HTMLElement,
	entries: ParsedTimelineEntry[],
	mode: TimelineMetadataReadingViewMode,
): void {
	for (const entry of entries) {
		const headingEl =
			findRenderedBlockElement(rootEl, entry.meta.id) ||
			findHeadingByEntryMeta(rootEl, entry.meta);

		if (!headingEl) {
			continue;
		}

		const alreadyRendered = rootEl.querySelector(
			`.pt-reading-metadata[data-entry-id="${entry.meta.id}"]`,
		);
		if (alreadyRendered) {
			continue;
		}

		const metadataEl = createReadingMetadataElement(
			rootEl.ownerDocument,
			entry.meta,
			mode,
		);
		headingEl.insertAdjacentElement("afterend", metadataEl);
	}
}

function findRenderedBlockElement(rootEl: HTMLElement, blockId: string): HTMLElement | null {
	const escapedId = CSS.escape(blockId);
	const anchor =
		rootEl.querySelector(`[href$="#^${escapedId}"]`) ||
		rootEl.querySelector(`[data-href$="#^${escapedId}"]`) ||
		rootEl.querySelector(`[id="${escapedId}"]`);

	if (!anchor) {
		return null;
	}

	return anchor.closest("h1,h2,h3,h4,h5,h6");
}

function findHeadingByEntryMeta(rootEl: HTMLElement, meta: TimelineEntryMeta): HTMLElement | null {
	const headings = Array.from(rootEl.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6"));
	return (
		headings.find((heading) => {
			const text = heading.textContent ?? "";
			return text.includes(meta.time);
		}) ?? null
	);
}

function createReadingMetadataElement(
	ownerDocument: Document,
	meta: TimelineEntryMeta,
	mode: TimelineMetadataReadingViewMode,
): HTMLElement {
	const container = ownerDocument.createDiv({
		cls: "pt-reading-metadata",
		attr: { "data-entry-id": meta.id },
	});

	if (mode === "summary") {
		renderMetadataSummary(container, meta);
	}

	if (mode === "table") {
		renderMetadataTable(container, meta);
	}

	if (mode === "json") {
		renderMetadataJson(container, meta);
	}

	return container;
}

function renderMetadataSummary(container: HTMLElement, meta: TimelineEntryMeta): void {
	const summary = [
		meta.type,
		meta.date,
		meta.time,
		`${meta.tags.length} tags`,
		`${meta.attachments.length} attachments`,
	].join(" · ");

	container.createDiv({
		cls: "pt-reading-metadata-summary",
		text: summary,
	});
}

function renderMetadataTable(container: HTMLElement, meta: TimelineEntryMeta): void {
	const headerEl = container.createDiv({
		cls: "pt-reading-metadata-header",
	});
	headerEl.createSpan({
		cls: "pt-reading-metadata-title",
		text: "Timeline metadata",
	});

	const copyButton = headerEl.createEl("button", {
		cls: "pt-reading-metadata-copy",
		text: "Copy JSON",
	});
	copyButton.addEventListener("click", () => {
		void navigator.clipboard.writeText(JSON.stringify(meta, null, 2));
	});

	const tableEl = container.createDiv({
		cls: "pt-reading-metadata-table",
	});
	renderMetadataRow(tableEl, "id", meta.id);
	renderMetadataRow(tableEl, "type", meta.type);
	renderMetadataRow(tableEl, "date", meta.date);
	renderMetadataRow(tableEl, "time", meta.time);
	renderMetadataRow(tableEl, "createdAt", meta.createdAt);
	renderMetadataRow(tableEl, "updatedAt", meta.updatedAt);
	renderMetadataRow(tableEl, "tags", meta.tags.join(", "));
	renderMetadataRow(tableEl, "source", meta.source);
	renderMetadataRow(tableEl, "attachments", String(meta.attachments.length));
}

function renderMetadataRow(container: HTMLElement, key: string, value: string): void {
	const rowEl = container.createDiv({
		cls: "pt-reading-metadata-row",
	});
	rowEl.createDiv({
		cls: "pt-reading-metadata-key",
		text: key,
	});
	rowEl.createDiv({
		cls: "pt-reading-metadata-value",
		text: value || "—",
	});
}

function renderMetadataJson(container: HTMLElement, meta: TimelineEntryMeta): void {
	const headerEl = container.createDiv({
		cls: "pt-reading-metadata-header",
	});
	headerEl.createSpan({
		cls: "pt-reading-metadata-title",
		text: "Timeline metadata JSON",
	});

	const copyButton = headerEl.createEl("button", {
		cls: "pt-reading-metadata-copy",
		text: "Copy JSON",
	});
	copyButton.addEventListener("click", () => {
		void navigator.clipboard.writeText(JSON.stringify(meta, null, 2));
	});

	const preEl = container.createEl("pre", {
		cls: "pt-reading-metadata-json",
	});
	const codeEl = preEl.createEl("code");
	codeEl.setText(JSON.stringify(meta, null, 2));
}
