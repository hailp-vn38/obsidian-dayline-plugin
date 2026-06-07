import { MarkdownView, Notice, Plugin, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";

import { TimelineIndexService } from "./index/TimelineIndexService";
import type { TimelineSourceContext } from "./models/TimelineEntry";
import type { TimelinePluginSettings } from "./models/TimelineSettings";
import { QuickCheckInModal } from "./quick-check-in/QuickCheckInModal";
import { renderDaylineCodeBlock } from "./reading/renderDaylineBlock";
import { renderTimelineMetadataInReadingView } from "./reading/renderTimelineMetadata";
import { DEFAULT_SETTINGS, TimelineSettingTab } from "./settings";
import type { PendingAttachmentInput } from "./storage/attachments";
import { TimelineRepository } from "./storage/timelineRepository";
import { TimelineView, VIEW_TYPE_TIMELINE } from "./views/TimelineView";
import {
	createSourceContext,
	createSourceContextFromView,
	getSourceContextTarget,
} from "./utils/sourceContext";
import { t } from "./i18n";

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

	async onload(): Promise<void> {
		await this.loadSettings();
		await this.initializeServices();
		this.registerView(
			VIEW_TYPE_TIMELINE,
			(leaf) => new TimelineView(leaf, this),
		);
		this.registerMarkdownPostProcessor((el, ctx) => {
			void renderTimelineMetadataInReadingView(this, el, ctx);
		});
		this.registerMarkdownCodeBlockProcessor("dayline", (source, el, ctx) => {
			renderDaylineCodeBlock(this, source, el, ctx);
		});
		this.registerVaultEvents();
		this.registerWorkspaceEvents();

		this.addRibbonIcon("list-todo", t(this.settings.language, "timeline.title"), () => {
			void this.activateTimelineView();
		});
		this.addCommand({
			id: "open-timeline",
			name: t(this.settings.language, "timeline.title"),
			callback: () => {
				void this.activateTimelineView();
			},
		});
		this.addCommand({
			id: "create-quick-check-in",
			name: t(this.settings.language, "timeline.createCheckIn"),
			callback: () => {
				this.openQuickCheckInModal();
			},
		});
		this.addCommand({
			id: "create-quick-check-in-from-selection",
			name: t(this.settings.language, "command.createCheckInFromSelection"),
			editorCallback: (editor) => {
				new QuickCheckInModal(this, { initialContent: editor.getSelection() }).open();
			},
		});
		this.addCommand({
			id: "create-linked-check-in",
			name: t(this.settings.language, "command.createLinkedCheckIn"),
			callback: () => {
				this.openLinkedQuickCheckInModal();
			},
		});
		this.addCommand({
			id: "create-linked-check-in-from-selection",
			name: t(this.settings.language, "command.createLinkedCheckInFromSelection"),
			editorCallback: (editor, view) => {
				const sourceContext = createSourceContextFromView(
					this.app,
					view,
					editor,
					"selection",
				);
				new QuickCheckInModal(this, {
					initialContent: editor.getSelection(),
					sourceContext,
				}).open();
			},
		});

		this.addSettingTab(new TimelineSettingTab(this.app, this));
	}

	onunload(): void {}

	async loadSettings(): Promise<void> {
		const loaded = (await this.loadData()) as Partial<TimelinePluginSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded ?? {});
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		await this.initializeServices();
		await this.timelineRepository.refreshAllDayProperties();
		await this.timelineIndex.rebuild();
		await this.refreshTimelineViews();
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
		await this.timelineRepository.createTextEntry(
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
		await this.timelineIndex.rebuild();
		await this.refreshTimelineViews();
	}

	private async refreshLeafView(leaf: WorkspaceLeaf): Promise<void> {
		const view = leaf.view;
		if (view instanceof TimelineView) {
			await view.refresh();
		}
	}

	private async initializeServices(): Promise<void> {
		this.timelineRepository = new TimelineRepository(this.app, this.settings);
		this.timelineIndex = new TimelineIndexService(this.app, this.settings);
		await this.timelineIndex.rebuild();
	}

	private registerVaultEvents(): void {
		this.registerEvent(this.app.vault.on("create", (file) => {
			void this.handleVaultUpdate(file);
		}));
		this.registerEvent(this.app.vault.on("modify", (file) => {
			void this.handleVaultUpdate(file);
		}));
		this.registerEvent(this.app.vault.on("delete", (file) => {
			void this.handleVaultDelete(file);
		}));
		this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
			this.timelineIndex.removeBySourcePath(oldPath);
			void this.handleVaultUpdate(file);
		}));
	}

	private registerWorkspaceEvents(): void {
		this.registerEvent(this.app.workspace.on("file-open", () => {
			void this.refreshTimelineViews();
		}));
		this.registerEvent(this.app.workspace.on("editor-menu", (menu, editor, view) => {
			const sourceContext = createSourceContextFromView(
				this.app,
				view,
				editor,
				editor.getSelection() ? "selection" : "note",
			);
			if (!sourceContext) {
				return;
			}

			menu.addItem((item) => {
				item
					.setTitle(t(this.settings.language, "command.addSelectionToDayline"))
					.setIcon("calendar-plus")
					.onClick(() => {
						new QuickCheckInModal(this, {
							initialContent: editor.getSelection(),
							sourceContext,
						}).open();
					});
			});
		}));
		this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
			if (!(file instanceof TFile) || file.extension !== "md") {
				return;
			}

			const sourceContext = createSourceContext({
				app: this.app,
				file,
				type: "file",
			});
			menu.addItem((item) => {
				item
					.setTitle(t(this.settings.language, "command.addFileToDayline"))
					.setIcon("calendar-plus")
					.onClick(() => {
						new QuickCheckInModal(this, { sourceContext }).open();
					});
			});
		}));
	}

	private async handleVaultUpdate(file: TAbstractFile): Promise<void> {
		if (!(file instanceof TFile)) {
			return;
		}

		await this.timelineIndex.refreshFile(file);
		await this.refreshTimelineViews();
	}

	private async handleVaultDelete(file: TAbstractFile): Promise<void> {
		this.timelineIndex.removeBySourcePath(file.path);
		await this.timelineIndex.rebuild();
		await this.refreshTimelineViews();
	}

	private openQuickCheckInModal(): void {
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		const selectedText = markdownView?.editor?.getSelection() ?? "";
		new QuickCheckInModal(this, { initialContent: selectedText }).open();
	}

	private openLinkedQuickCheckInModal(): void {
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
