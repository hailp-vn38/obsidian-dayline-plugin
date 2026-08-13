import { TAbstractFile, TFile, type App, type Plugin } from "obsidian";

import type { TimelinePluginSettings } from "../models/TimelineSettings";
import { isPathInFolder, isTimelineMarkdownPath } from "../utils/timelinePath";
import type { TimelineIndexService } from "./TimelineIndexService";

interface TimelineEventCoordinatorOptions {
	app: App;
	plugin: Plugin;
	settings: TimelinePluginSettings;
	index: TimelineIndexService;
	onIndexChanged: () => Promise<void>;
	invalidateReadingCache: (path?: string) => void;
}

export class TimelineEventCoordinator {
	private readonly pendingUpdates = new Map<string, TFile>();
	private readonly pendingRemovals = new Set<string>();
	private timer: number | null = null;
	private queue: Promise<void> = Promise.resolve();
	private pendingRebuild = false;
	private disposed = false;

	constructor(private readonly options: TimelineEventCoordinatorOptions) {}

	register(): void {
		this.disposed = false;
		const { app, plugin } = this.options;
		plugin.registerEvent(app.vault.on("create", (file) => {
			this.handleUpdate(file);
		}));
		plugin.registerEvent(app.vault.on("modify", (file) => {
			this.handleUpdate(file);
		}));
		plugin.registerEvent(app.vault.on("delete", (file) => {
			this.handleDelete(file);
		}));
		plugin.registerEvent(app.vault.on("rename", (file, oldPath) => {
			this.handleRename(file, oldPath);
		}));
	}

	dispose(): void {
		this.disposed = true;
		if (this.timer !== null) {
			window.clearTimeout(this.timer);
			this.timer = null;
		}
		this.pendingUpdates.clear();
		this.pendingRemovals.clear();
	}

	async refreshFile(file: TFile): Promise<void> {
		this.pendingUpdates.delete(file.path);
		await this.queue;
		await this.options.index.whenReady();
		if (await this.options.index.refreshFile(file, true)) {
			await this.options.onIndexChanged();
		}
	}

	private handleUpdate(file: TAbstractFile): void {
		if (
			!(file instanceof TFile) ||
			!isTimelineMarkdownPath(
				file.path,
				this.options.settings.timelineFolder,
			)
		) {
			return;
		}

		this.pendingUpdates.set(file.path, file);
		this.options.invalidateReadingCache(file.path);
		this.scheduleFlush();
	}

	private handleDelete(file: TAbstractFile): void {
		if (!isPathInFolder(file.path, this.options.settings.timelineFolder)) {
			return;
		}

		this.pendingRemovals.add(file.path);
		this.pendingUpdates.delete(file.path);
		this.options.invalidateReadingCache(
			file instanceof TFile ? file.path : undefined,
		);
		this.scheduleFlush();
	}

	private handleRename(file: TAbstractFile, oldPath: string): void {
		const oldPathWasRelevant = isPathInFolder(
			oldPath,
			this.options.settings.timelineFolder,
		);
		const newPathIsRelevant = isPathInFolder(
			file.path,
			this.options.settings.timelineFolder,
		);
		if (!oldPathWasRelevant && !newPathIsRelevant) {
			return;
		}

		if (!(file instanceof TFile)) {
			this.options.invalidateReadingCache();
			this.pendingRebuild = true;
			this.scheduleFlush();
			return;
		}

		if (oldPathWasRelevant) {
			this.pendingRemovals.add(oldPath);
			this.pendingUpdates.delete(oldPath);
			this.options.invalidateReadingCache(oldPath);
		}
		if (
			isTimelineMarkdownPath(
				file.path,
				this.options.settings.timelineFolder,
			)
		) {
			this.pendingUpdates.set(file.path, file);
			this.options.invalidateReadingCache(file.path);
		}
		this.scheduleFlush();
	}

	private scheduleFlush(): void {
		if (this.disposed) {
			return;
		}
		if (this.timer !== null) {
			window.clearTimeout(this.timer);
		}
		this.timer = window.setTimeout(() => {
			this.timer = null;
			this.flush();
		}, 75);
	}

	private flush(): void {
		const updates = Array.from(this.pendingUpdates.values());
		const removals = new Set(this.pendingRemovals);
		const shouldRebuild = this.pendingRebuild;
		this.pendingUpdates.clear();
		this.pendingRemovals.clear();
		this.pendingRebuild = false;

		const operation = this.queue.then(async () => {
			await this.options.index.whenReady();
			let indexChanged = false;
			if (shouldRebuild) {
				await this.options.index.rebuild();
				indexChanged = true;
			} else {
				indexChanged = this.options.index.removeByPathPrefixes(removals);
				for (const file of updates) {
					indexChanged =
						(await this.options.index.refreshFile(file)) || indexChanged;
				}
			}

			if (indexChanged && !this.disposed) {
				await this.options.onIndexChanged();
			}
		});
		this.queue = operation.catch((error: unknown) => {
			console.error("Unable to refresh the Dayline index", error);
		});
	}
}
