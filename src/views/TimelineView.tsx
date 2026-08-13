import { ItemView, WorkspaceLeaf } from "obsidian";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import type DaylinePlugin from "../main";
import { PluginContext } from "../context/PluginContext";
import { TimelineRoot } from "../components/TimelineRoot";
import { t } from "../i18n";

export const VIEW_TYPE_TIMELINE = "dayline-view";

export class TimelineView extends ItemView {
	private readonly plugin: DaylinePlugin;
	private reactRoot: Root | null = null;
	private refreshRevision = 0;

	constructor(leaf: WorkspaceLeaf, plugin: DaylinePlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_TIMELINE;
	}

	getDisplayText(): string {
		return t(this.plugin.settings.language, "timeline.title");
	}

	getIcon(): string {
		return "list-todo";
	}

	async onOpen(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.addClass("dayline-view-container");
		this.reactRoot = createRoot(this.contentEl);
		this.renderReact();
		void this.plugin.ensureTimelineIndexReady();
	}

	async onClose(): Promise<void> {
		if (this.reactRoot) {
			this.reactRoot.unmount();
			this.reactRoot = null;
		}
		this.contentEl.removeClass("dayline-view-container");
		this.contentEl.empty();
	}

	async refresh(): Promise<void> {
		this.refreshRevision += 1;
		this.renderReact();
	}

	private renderReact(): void {
		if (!this.reactRoot) return;
		this.reactRoot.render(
			<PluginContext.Provider
				value={{ plugin: this.plugin, app: this.app }}
			>
				<TimelineRoot refreshRevision={this.refreshRevision} />
			</PluginContext.Provider>,
		);
	}
}
