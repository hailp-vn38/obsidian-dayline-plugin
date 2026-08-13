import {
	MarkdownView,
	Notice,
	Plugin,
	TFile,
	WorkspaceLeaf,
} from "obsidian";

import {
	getActiveSelection,
	registerCommands,
} from "./commands/registerCommands";
import { t } from "./i18n";
import { TimelineEventCoordinator } from "./index/TimelineEventCoordinator";
import { TimelineIndexService } from "./index/TimelineIndexService";
import { registerWorkspaceIntegrations } from "./integrations/registerWorkspaceIntegrations";
import type { TimelineSourceContext } from "./models/TimelineEntry";
import type { TimelinePluginSettings } from "./models/TimelineSettings";
import { QuickCheckInModal } from "./quick-check-in/QuickCheckInModal";
import { renderDaylineCodeBlock } from "./reading/renderDaylineBlock";
import {
	invalidateTimelineMetadataCache,
	renderTimelineMetadataInReadingView,
} from "./reading/renderTimelineMetadata";
import { DEFAULT_SETTINGS, TimelineSettingTab } from "./settings";
import { TimelineSettingsService } from "./settings/TimelineSettingsService";
import type { SettingsEffect } from "./settings/settingsEffects";
import type { PendingAttachmentInput } from "./storage/attachments";
import { TimelineRepository } from "./storage/timelineRepository";
import { TimelineView, VIEW_TYPE_TIMELINE } from "./views/TimelineView";
import {
	createSourceContextFromView,
	getSourceContextTarget,
} from "./utils/sourceContext";

interface CreateQuickCheckInInput {
	content: string;
	tags: string[];
	attachments: PendingAttachmentInput[];
	source: "quick-capture" | "manual" | "imported";
	sourceContext?: TimelineSourceContext;
}

export default class DaylinePlugin extends Plugin {
	settings!: TimelinePluginSettings;
	timelineRepository!: TimelineRepository;
	timelineIndex!: TimelineIndexService;
	private settingsService!: TimelineSettingsService;
	private timelineEvents!: TimelineEventCoordinator;
	private timelineIndexReadyPromise: Promise<void> | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.initializeServices();
		this.registerView(
			VIEW_TYPE_TIMELINE,
			(leaf) => new TimelineView(leaf, this),
		);
		this.registerMarkdownPostProcessor((el, ctx) => {
			void renderTimelineMetadataInReadingView(this, el, ctx).catch(
				(error: unknown) => {
					console.error("Unable to render Dayline metadata", error);
				},
			);
		});
		this.registerMarkdownCodeBlockProcessor("dayline", async (source, el, ctx) => {
			await this.ensureTimelineIndexReady();
			renderDaylineCodeBlock(this, source, el, ctx);
		});
		this.timelineEvents.register();
		registerWorkspaceIntegrations(this);
		registerCommands(this);

		this.addSettingTab(new TimelineSettingTab(this.app, this));
		this.app.workspace.onLayoutReady(() => {
			void this.ensureTimelineIndexReady();
		});
	}

	onunload(): void {
		this.timelineEvents.dispose();
		invalidateTimelineMetadataCache(this);
	}

	async loadSettings(): Promise<void> {
		const loaded = (await this.loadData()) as Partial<TimelinePluginSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded ?? {});
	}

	async persistSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	async saveSettings(effect: SettingsEffect): Promise<void> {
		await this.settingsService.apply(effect);
	}

	async activateTimelineView(): Promise<void> {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_TIMELINE)[0];

		if (!leaf) {
			const rightLeaf = workspace.getRightLeaf(false);
			if (!rightLeaf) {
				new Notice(t(this.settings.language, "notice.openTimelineFailed"));
				return;
			}

			leaf = rightLeaf;
			await leaf.setViewState({ type: VIEW_TYPE_TIMELINE, active: true });
		}

		void workspace.revealLeaf(leaf);
		await this.refreshLeafView(leaf);
	}

	async refreshTimelineViews(): Promise<void> {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TIMELINE)) {
			await this.refreshLeafView(leaf);
		}
	}

	async refreshTimelineFile(file: TFile): Promise<void> {
		await this.timelineEvents.refreshFile(file);
	}

	async ensureTimelineIndexReady(): Promise<void> {
		if (this.timelineIndex.getStatus() === "ready") {
			return;
		}
		if (this.timelineIndexReadyPromise) {
			return this.timelineIndexReadyPromise;
		}

		this.timelineIndexReadyPromise = (async () => {
			if (this.timelineIndex.getStatus() === "loading") {
				await this.timelineIndex.whenReady();
			} else {
				await this.timelineIndex.rebuild();
			}
			await this.refreshTimelineViews();
		})();
		try {
			await this.timelineIndexReadyPromise;
		} catch (error) {
			console.error("Unable to build the Dayline index", error);
		} finally {
			this.timelineIndexReadyPromise = null;
		}
	}

	async openTimelineSource(file: TFile, entryId?: string): Promise<void> {
		if (entryId) {
			const linkText = this.app.metadataCache.fileToLinktext(file, "", false);
			await this.app.workspace.openLinkText(`${linkText}#^${entryId}`, "", true);
			return;
		}

		await this.app.workspace.getLeaf(true).openFile(file);
	}

	async openSourceContext(sourceContext: TimelineSourceContext): Promise<void> {
		await this.app.workspace.openLinkText(
			getSourceContextTarget(sourceContext),
			"",
			true,
		);
	}

	async createQuickCheckIn(input: CreateQuickCheckInInput): Promise<void> {
		const result = await this.timelineRepository.createTextEntry(
			{
				content: input.content,
				tags: input.tags,
				type: "checkin",
				source: input.source,
				sourceContext: input.sourceContext,
				attachments: [],
			},
			new Date(),
			input.attachments,
		);
		await this.refreshTimelineFile(result.file);
	}

	private async refreshLeafView(leaf: WorkspaceLeaf): Promise<void> {
		const view = leaf.view;
		if (view instanceof TimelineView) {
			await view.refresh();
		}
	}

	private initializeServices(): void {
		this.timelineRepository = new TimelineRepository(this.app, this.settings);
		this.timelineIndex = new TimelineIndexService(this.app, this.settings);
		this.settingsService = new TimelineSettingsService({
			persist: () => this.persistSettings(),
			repository: this.timelineRepository,
			index: this.timelineIndex,
			refreshTimelineViews: () => this.refreshTimelineViews(),
		});
		this.timelineEvents = new TimelineEventCoordinator({
			app: this.app,
			plugin: this,
			settings: this.settings,
			index: this.timelineIndex,
			onIndexChanged: () => this.refreshTimelineViews(),
			invalidateReadingCache: (path) => {
				invalidateTimelineMetadataCache(this, path);
			},
		});
	}

	openQuickCheckInModal(): void {
		new QuickCheckInModal(this, {
			initialContent: getActiveSelection(this),
		}).open();
	}

	openLinkedQuickCheckInModal(): void {
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		const sourceContext = createSourceContextFromView(
			this.app,
			markdownView,
			markdownView?.editor,
			markdownView?.editor?.getSelection() ? "selection" : "note",
		);
		if (!sourceContext) {
			new Notice(t(this.settings.language, "notice.noActiveSource"));
			return;
		}

		new QuickCheckInModal(this, {
			initialContent: markdownView?.editor?.getSelection() ?? "",
			sourceContext,
		}).open();
	}
}
