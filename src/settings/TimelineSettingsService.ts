import type { TimelineIndexService } from "../index/TimelineIndexService";
import type { TimelineRepository } from "../storage/timelineRepository";
import type { SettingsEffect } from "./settingsEffects";

interface TimelineSettingsServiceOptions {
	persist: () => Promise<void>;
	repository: TimelineRepository;
	index: TimelineIndexService;
	refreshTimelineViews: () => Promise<void>;
}

export class TimelineSettingsService {
	private queue: Promise<void> = Promise.resolve();

	constructor(private readonly options: TimelineSettingsServiceOptions) {}

	apply(effect: SettingsEffect): Promise<void> {
		const operation = this.queue.then(async () => {
			await this.options.persist();

			if (effect.rewriteEntryMarkdown) {
				await this.options.repository.rewriteAllEntryMarkdownForCurrentSettings();
			} else if (effect.refreshDayProperties) {
				await this.options.repository.refreshAllDayProperties();
			}

			if (effect.rebuildIndex) {
				await this.options.index.rebuild();
			}

			if (effect.refreshTimelineViews) {
				await this.options.refreshTimelineViews();
			}
		});
		this.queue = operation.catch((error: unknown) => {
			console.error("Unable to apply Dayline settings", error);
		});
		return operation;
	}
}
