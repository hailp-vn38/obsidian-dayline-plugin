import { TFile, type App } from "obsidian";

import type { TimelineIndexItem } from "../models/TimelineEntry";
import type { TimelinePluginSettings } from "../models/TimelineSettings";
import { countMalformedTimelineEntryMetas, parseTimelineEntries } from "../parser/parseTimelineEntries";
import { extractEditableMarkdownContent } from "../storage/timelineRepository";
import { getMarkdownFilesInFolder } from "../storage/vaultFiles";
import { isPathInFolder, isTimelineMarkdownPath } from "../utils/timelinePath";

import { TimelineIndex } from "./TimelineIndex";

export class TimelineIndexService {
	private readonly index = new TimelineIndex();
	private fileCache = new Map<string, CachedTimelineFile>();
	private malformedEntryCount = 0;
	private availableTagsSnapshot: string[] | null = null;
	private status: TimelineIndexStatus = "idle";
	private rebuildPromise: Promise<void> | null = null;
	private rebuildRequested = false;

	constructor(
		private readonly app: App,
		private readonly settings: TimelinePluginSettings,
	) {}

	async rebuild(): Promise<void> {
		if (this.rebuildPromise) {
			this.rebuildRequested = true;
			return this.rebuildPromise;
		}

		this.status = "loading";
		this.rebuildPromise = this.runRebuildLoop();
		try {
			await this.rebuildPromise;
			this.status = "ready";
		} catch (error) {
			this.status = "error";
			throw error;
		} finally {
			this.rebuildPromise = null;
		}
	}

	getStatus(): TimelineIndexStatus {
		return this.status;
	}

	async whenReady(): Promise<void> {
		if (this.rebuildPromise) {
			await this.rebuildPromise;
		}
	}

	async refreshFile(file: TFile, force = false): Promise<boolean> {
		if (!isTimelineMarkdownPath(file.path, this.settings.timelineFolder)) {
			return false;
		}
		const cachedFile = this.fileCache.get(file.path);
		if (!force && cachedFile?.mtime === file.stat.mtime) {
			return false;
		}

		await this.readAndCacheFile(file);
		this.rebuildIndexFromCache();
		return true;
	}

	removeBySourcePath(path: string): boolean {
		if (!this.fileCache.delete(path)) {
			return false;
		}
		this.rebuildIndexFromCache();
		return true;
	}

	removeByPathPrefix(path: string): boolean {
		return this.removeByPathPrefixes([path]);
	}

	removeByPathPrefixes(paths: Iterable<string>): boolean {
		const prefixes = Array.from(paths);
		let didRemove = false;
		for (const cachedPath of this.fileCache.keys()) {
			if (prefixes.some((path) => isPathInFolder(cachedPath, path))) {
				this.fileCache.delete(cachedPath);
				didRemove = true;
			}
		}

		if (didRemove) {
			this.rebuildIndexFromCache();
		}
		return didRemove;
	}

	getAll(): TimelineIndexItem[] {
		return this.index.getAll();
	}

	getAvailableTags(): string[] {
		if (!this.availableTagsSnapshot) {
			this.availableTagsSnapshot = Array.from(
				new Set(this.index.getAll().flatMap((item) => item.tags)),
			).sort((left, right) => left.localeCompare(right));
		}
		return this.availableTagsSnapshot;
	}

	getTagSuggestionsForDate(
		date: string,
		excludedTags: string[] = [],
		limit = 8,
	): string[] {
		const excluded = new Set(excludedTags);
		const tagStats = new Map<string, { count: number; lastUsedAt: string }>();

		for (const item of this.index.getAll()) {
			if (item.date !== date) {
				continue;
			}

			for (const tag of item.tags) {
				if (excluded.has(tag)) {
					continue;
				}

				const current = tagStats.get(tag);
				if (!current) {
					tagStats.set(tag, {
						count: 1,
						lastUsedAt: item.createdAt,
					});
					continue;
				}

				current.count += 1;
				if (item.createdAt > current.lastUsedAt) {
					current.lastUsedAt = item.createdAt;
				}
			}
		}

		return [...tagStats.entries()]
			.sort((left, right) => {
				const [, leftStat] = left;
				const [, rightStat] = right;
				if (rightStat.count !== leftStat.count) {
					return rightStat.count - leftStat.count;
				}

				if (rightStat.lastUsedAt !== leftStat.lastUsedAt) {
					return rightStat.lastUsedAt.localeCompare(leftStat.lastUsedAt);
				}

				return left[0].localeCompare(right[0]);
			})
			.slice(0, limit)
			.map(([tag]) => tag);
	}

	getMalformedEntryCount(): number {
		return this.malformedEntryCount;
	}

	private async readAndCacheFile(file: TFile): Promise<void> {
		this.fileCache.set(file.path, await this.readFile(file));
	}

	private async readFile(file: TFile): Promise<CachedTimelineFile> {
		const markdown = await this.app.vault.cachedRead(file);
		const malformedCount = countMalformedTimelineEntryMetas(markdown);
		const entries = parseTimelineEntries(markdown);
		const items = entries.map((entry) => createIndexItem(file, entry));
		return {
			path: file.path,
			mtime: file.stat.mtime,
			malformedCount,
			items,
		};
	}

	private async runRebuildLoop(): Promise<void> {
		do {
			this.rebuildRequested = false;
			const nextCache = await this.buildFileCache();
			if (!this.rebuildRequested) {
				this.fileCache = nextCache;
				this.rebuildIndexFromCache();
			}
		} while (this.rebuildRequested);
	}

	private async buildFileCache(): Promise<Map<string, CachedTimelineFile>> {
		const files = getMarkdownFilesInFolder(this.app, this.settings.timelineFolder);
		const nextCache = new Map<string, CachedTimelineFile>();
		let nextFileIndex = 0;
		const worker = async (): Promise<void> => {
			while (nextFileIndex < files.length) {
				const file = files[nextFileIndex];
				nextFileIndex += 1;
				if (!file) {
					continue;
				}
				nextCache.set(file.path, await this.readFile(file));
			}
		};
		const workerCount = Math.min(4, files.length);
		await Promise.all(
			Array.from({ length: workerCount }, () => worker()),
		);
		return nextCache;
	}

	private rebuildIndexFromCache(): void {
		this.index.clear();
		this.malformedEntryCount = 0;
		this.availableTagsSnapshot = null;

		for (const cachedFile of this.fileCache.values()) {
			this.malformedEntryCount += cachedFile.malformedCount;
			for (const item of cachedFile.items) {
				this.index.upsert(item);
			}
		}
	}
}

export type TimelineIndexStatus = "idle" | "loading" | "ready" | "error";

interface CachedTimelineFile {
	path: string;
	mtime: number;
	malformedCount: number;
	items: TimelineIndexItem[];
}

function extractTextPreview(blockMarkdown: string): string {
	const body = blockMarkdown
		.replace(/^##\s+.*$/m, "")
		.replace(/<!--\s*timeline-entry\s*[\s\S]*?\s*-->/, "")
		.replace(/^\s*Context:\s+\[\[[^\]]+\]\]\s*$/gm, "")
		.replace(/^\s*Dayline tags:\s+(?:#[^\s#]+(?:\s+|$))+\s*$/gm, "")
		.replace(/^!\[\[(.*?)\]\]\s*$/gm, "")
		.replace(/^\[\[(.*?)\]\]\s*$/gm, "")
		.trim();

	return body.length > 240 ? `${body.slice(0, 237)}...` : body;
}

function createIndexItem(file: TFile, entry: ReturnType<typeof parseTimelineEntries>[number]): TimelineIndexItem {
	const contentMarkdown = extractEditableMarkdownContent(
		entry.markdown,
		entry.meta.attachments,
		entry.meta.sourceContext,
		entry.meta.tags,
	);

	return {
		id: entry.meta.id,
		type: entry.meta.type,
		date: entry.meta.date,
		time: entry.meta.time,
		createdAt: entry.meta.createdAt,
		updatedAt: entry.meta.updatedAt,
		tags: entry.meta.tags,
		mood: entry.meta.mood,
		attachments: entry.meta.attachments,
		attachmentTypes: entry.meta.attachments.map((attachment) => attachment.type),
		sourceContext: entry.meta.sourceContext,
		hasSourceContext: Boolean(entry.meta.sourceContext),
		sourcePath: file.path,
		blockId: entry.meta.id,
		textPreview: extractTextPreview(entry.markdown),
		contentMarkdown,
	};
}
