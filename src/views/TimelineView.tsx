import { ItemView, WorkspaceLeaf } from "obsidian";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import type PersonalTimelinePlugin from "../main";
import { PluginContext } from "../context/PluginContext";
import { TimelineRoot } from "../components/TimelineRoot";

export const VIEW_TYPE_TIMELINE = "personal-timeline-view";

export class TimelineView extends ItemView {
	private readonly plugin: PersonalTimelinePlugin;
	private reactRoot: Root | null = null;
	private refreshRevision = 0;

	constructor(leaf: WorkspaceLeaf, plugin: PersonalTimelinePlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_TIMELINE;
	}

	getDisplayText(): string {
		return "Personal timeline";
	}

	getIcon(): string {
		return "list-todo";
	}

	async onOpen(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.addClass("personal-timeline-view-container");
		this.reactRoot = createRoot(this.contentEl);
		this.renderReact();
	}

	async onClose(): Promise<void> {
		if (this.reactRoot) {
			this.reactRoot.unmount();
			this.reactRoot = null;
		}
		this.contentEl.removeClass("personal-timeline-view-container");
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
