import { App, PluginSettingTab, Setting } from "obsidian";

import type DaylinePlugin from "../main";
import type {
	TimelineDailyNotesMode,
	TimelineDefaultView,
	TimelineFileOrganization,
	TimelineLanguage,
	TimelineMetadataReadingViewMode,
	TimelinePluginSettings,
	TimelineTimeFormat,
} from "../models/TimelineSettings";
import { LANGUAGE_OPTIONS, t } from "../i18n";
import { getSettingsEffect } from "./settingsEffects";

const FILE_ORGANIZATION_OPTIONS: Record<TimelineFileOrganization, string> = {
	flat: "Flat",
	year: "Year",
	"year-month": "Year / month",
};

const DEFAULT_VIEW_OPTIONS: Record<TimelineDefaultView, string> = {
	today: "Today",
	"last-opened": "Last opened",
};

const TIME_FORMAT_OPTIONS: Record<TimelineTimeFormat, string> = {
	"12h": "12-hour",
	"24h": "24-hour",
};

const METADATA_READING_VIEW_OPTIONS: Record<TimelineMetadataReadingViewMode, string> = {
	summary: "Summary",
	table: "Table",
	json: "Raw JSON",
};

const DAILY_NOTES_MODE_OPTIONS: Record<TimelineDailyNotesMode, string> = {
	off: "Off",
	link: "Link daily note",
};

type SettingKey = keyof TimelinePluginSettings;
type SettingPredicate = boolean | (() => boolean);

type SettingControl = {
	type: "toggle" | "text" | "dropdown";
	key: SettingKey;
	defaultValue?: string | boolean;
	disabled?: SettingPredicate;
	options?: Record<string, string>;
	placeholder?: string;
	validate?: (value: unknown) => string | void | Promise<string | void>;
};

type SettingDefinitionItem = {
	name: string;
	desc?: string | DocumentFragment;
	searchable?: boolean;
	visible?: SettingPredicate;
	control?: SettingControl;
	render?: (setting: Setting) => void | (() => void) | Promise<void | (() => void)>;
	action?: (index: number) => void | Promise<void>;
};

type SettingDefinitionGroup = {
	type: "group";
	heading: string;
	items: SettingDefinition[];
	searchable?: boolean;
	visible?: SettingPredicate;
};

type SettingDefinition = SettingDefinitionItem | SettingDefinitionGroup;

export class TimelineSettingTab extends PluginSettingTab {
	plugin: DaylinePlugin;
	private readonly pendingControlValues = new Map<SettingKey, unknown>();
	private readonly controlTimers = new Map<SettingKey, number>();

	constructor(app: App, plugin: DaylinePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getControlValue(key: string): unknown {
		return this.plugin.settings[key as SettingKey];
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		const settingKey = key as SettingKey;
		const previousValue = this.getControlValue(settingKey);
		this.setSettingValue(settingKey, value);
		if (Object.is(previousValue, this.getControlValue(settingKey))) {
			return;
		}

		await this.plugin.saveSettings(getSettingsEffect(settingKey));

		if (key === "language" || key === "dailyNotesMode") {
			this.refreshSettingsTab();
		}
	}

	hide(): void {
		void this.flushPendingControls();
		super.hide();
	}

	getSettingDefinitions(): SettingDefinition[] {
		const language = this.plugin.settings.language;

		return [
			{
				name: t(language, "settings.language.name"),
				desc: t(language, "settings.language.desc"),
				control: {
					type: "dropdown",
					key: "language",
					defaultValue: "en",
					options: LANGUAGE_OPTIONS,
				},
			},
			{
				type: "group",
				heading: t(language, "settings.storage.heading"),
				items: [
					{
						name: t(language, "settings.timelineFolder.name"),
						desc: t(language, "settings.timelineFolder.desc"),
						control: {
							type: "text",
							key: "timelineFolder",
							placeholder: "Timeline",
						},
					},
					{
						name: t(language, "settings.attachmentFolder.name"),
						desc: t(language, "settings.attachmentFolder.desc"),
						control: {
							type: "text",
							key: "attachmentFolder",
							placeholder: "Timeline attachments",
						},
					},
					{
						name: t(language, "settings.fileOrganization.name"),
						desc: t(language, "settings.fileOrganization.desc"),
						control: {
							type: "dropdown",
							key: "fileOrganization",
							defaultValue: "year-month",
							options: FILE_ORGANIZATION_OPTIONS,
						},
					},
					{
						name: t(language, "settings.defaultView.name"),
						desc: t(language, "settings.defaultView.desc"),
						control: {
							type: "dropdown",
							key: "defaultView",
							defaultValue: "today",
							options: DEFAULT_VIEW_OPTIONS,
						},
					},
					{
						name: t(language, "settings.timeFormat.name"),
						desc: t(language, "settings.timeFormat.desc"),
						control: {
							type: "dropdown",
							key: "timeFormat",
							defaultValue: "24h",
							options: TIME_FORMAT_OPTIONS,
						},
					},
				],
			},
			{
				type: "group",
				heading: t(language, "settings.timelineView.heading"),
				items: [
					{
						name: t(language, "settings.renderMarkdown.name"),
						desc: t(language, "settings.renderMarkdown.desc"),
						control: {
							type: "toggle",
							key: "renderTimelineContentMarkdown",
						},
					},
					{
						name: t(language, "settings.linkedSourcePreview.name"),
						desc: t(language, "settings.linkedSourcePreview.desc"),
						control: {
							type: "toggle",
							key: "showLinkedSourcePreview",
						},
					},
					{
						name: t(language, "settings.timelineCalendar.name"),
						desc: t(language, "settings.timelineCalendar.desc"),
						control: {
							type: "toggle",
							key: "showTimelineCalendar",
						},
					},
					{
						name: t(language, "settings.writeTagsAsObsidianTags.name"),
						desc: t(language, "settings.writeTagsAsObsidianTags.desc"),
						render: (setting) => this.renderWriteTagsSetting(setting),
					},
					{
						name: t(language, "settings.dotColor.name"),
						desc: t(language, "settings.dotColor.desc"),
						render: (setting) =>
							this.renderColorSetting(
								setting,
								"timelineDotColor",
								"#000000",
								language,
							),
					},
					{
						name: t(language, "settings.lineColor.name"),
						desc: t(language, "settings.lineColor.desc"),
						render: (setting) =>
							this.renderColorSetting(
								setting,
								"timelineLineColor",
								"#000000",
								language,
							),
					},
				],
			},
			{
				type: "group",
				heading: t(language, "settings.readingView.heading"),
				items: [
					{
						name: t(language, "settings.showMetadata.name"),
						desc: t(language, "settings.showMetadata.desc"),
						control: {
							type: "toggle",
							key: "showMetadataInReadingView",
						},
					},
					{
						name: t(language, "settings.metadataMode.name"),
						desc: t(language, "settings.metadataMode.desc"),
						control: {
							type: "dropdown",
							key: "metadataReadingViewMode",
							defaultValue: "summary",
							options: METADATA_READING_VIEW_OPTIONS,
						},
					},
				],
			},
			{
				type: "group",
				heading: t(language, "settings.properties.heading"),
				items: [
					{
						name: t(language, "settings.propertyEnrichment.name"),
						desc: t(language, "settings.propertyEnrichment.desc"),
						control: {
							type: "toggle",
							key: "propertyEnrichmentEnabled",
						},
					},
					{
						name: t(language, "settings.dailyNotesMode.name"),
						desc: t(language, "settings.dailyNotesMode.desc"),
						control: {
							type: "dropdown",
							key: "dailyNotesMode",
							defaultValue: "off",
							options: DAILY_NOTES_MODE_OPTIONS,
						},
					},
					{
						name: t(language, "settings.dailyNoteLinkProperty.name"),
						desc: t(language, "settings.dailyNoteLinkProperty.desc"),
						visible: () => this.plugin.settings.dailyNotesMode === "link",
						control: {
							type: "text",
							key: "dailyNoteLinkProperty",
							placeholder: "Daily note",
						},
					},
				],
			},
		];
	}

	display(): void {
		this.containerEl.empty();
		this.containerEl.addClass("dayline-settings-tab");
		this.renderSettingDefinitions(this.getSettingDefinitions(), this.containerEl);
	}

	private setSettingValue(key: SettingKey, value: unknown): void {
		switch (key) {
			case "language":
				this.plugin.settings.language = this.asOption(
					value,
					LANGUAGE_OPTIONS,
					"en",
				);
				break;
			case "timelineFolder":
				this.plugin.settings.timelineFolder = this.normalizeText(
					value,
					"Timeline",
				);
				break;
			case "attachmentFolder":
				this.plugin.settings.attachmentFolder = this.normalizeText(
					value,
					"Timeline Attachments",
				);
				break;
			case "fileOrganization":
				this.plugin.settings.fileOrganization = this.asOption(
					value,
					FILE_ORGANIZATION_OPTIONS,
					"year-month",
				);
				break;
			case "defaultView":
				this.plugin.settings.defaultView = this.asOption(
					value,
					DEFAULT_VIEW_OPTIONS,
					"today",
				);
				break;
			case "timeFormat":
				this.plugin.settings.timeFormat = this.asOption(
					value,
					TIME_FORMAT_OPTIONS,
					"24h",
				);
				break;
			case "renderTimelineContentMarkdown":
				this.plugin.settings.renderTimelineContentMarkdown = value === true;
				break;
			case "showLinkedSourcePreview":
				this.plugin.settings.showLinkedSourcePreview = value === true;
				break;
			case "showTimelineCalendar":
				this.plugin.settings.showTimelineCalendar = value === true;
				break;
			case "showMetadataInReadingView":
				this.plugin.settings.showMetadataInReadingView = value === true;
				break;
			case "metadataReadingViewMode":
				this.plugin.settings.metadataReadingViewMode = this.asOption(
					value,
					METADATA_READING_VIEW_OPTIONS,
					"summary",
				);
				break;
			case "propertyEnrichmentEnabled":
				this.plugin.settings.propertyEnrichmentEnabled = value === true;
				break;
			case "dailyNotesMode":
				this.plugin.settings.dailyNotesMode = this.asOption(
					value,
					DAILY_NOTES_MODE_OPTIONS,
					"off",
				);
				break;
			case "dailyNoteLinkProperty":
				this.plugin.settings.dailyNoteLinkProperty = this.normalizeText(
					value,
					"daily_note",
				);
				break;
			case "writeTagsAsObsidianTags":
				this.plugin.settings.writeTagsAsObsidianTags = value === true;
				break;
			case "timelineDotColor":
			case "timelineLineColor":
				this.plugin.settings[key] = this.normalizeText(value, "");
				break;
		}
	}

	private renderWriteTagsSetting(setting: Setting): void {
		setting.addToggle((toggle) =>
			toggle
				.setValue(this.plugin.settings.writeTagsAsObsidianTags)
				.onChange(async (value) => {
					await this.setControlValue("writeTagsAsObsidianTags", value);
				}),
		);
	}

	private renderColorSetting(
		setting: Setting,
		key: "timelineDotColor" | "timelineLineColor",
		fallbackColor: string,
		language: TimelineLanguage,
	): void {
		setting
			.addColorPicker((picker) =>
				picker
					.setValue(this.plugin.settings[key] || fallbackColor)
					.onChange((value) => {
						this.scheduleControlValue(key, value, 100);
					}),
			)
			.addButton((button) =>
				button
					.setButtonText(t(language, "common.reset"))
					.onClick(async () => {
						this.cancelPendingControl(key);
						await this.setControlValue(key, "");
						this.refreshSettingsTab();
					}),
			);
	}

	private renderSettingDefinitions(
		definitions: SettingDefinition[],
		containerEl: HTMLElement,
	): void {
		for (const definition of definitions) {
			if (!this.isVisible(definition.visible)) {
				continue;
			}

			if (this.isGroupDefinition(definition)) {
				new Setting(containerEl).setName(definition.heading).setHeading();
				this.renderSettingDefinitions(definition.items, containerEl);
				continue;
			}

			const setting = new Setting(containerEl).setName(definition.name);
			if (definition.desc) {
				setting.setDesc(definition.desc);
			}

			if (definition.render) {
				void definition.render(setting);
				continue;
			}

			if (definition.action) {
				setting.settingEl.onClickEvent(() => {
					void definition.action?.(0);
				});
				continue;
			}

			if (definition.control) {
				this.renderControl(setting, definition.control);
			}
		}
	}

	private renderControl(setting: Setting, control: SettingControl): void {
		switch (control.type) {
			case "toggle":
				setting.addToggle((toggle) =>
					toggle
						.setValue(this.getBooleanControlValue(control))
						.onChange((value) => {
							void this.setControlValue(control.key, value);
						}),
				);
				break;
			case "text":
				setting.addText((text) => {
					if (control.placeholder) {
						text.setPlaceholder(control.placeholder);
					}

					text
						.setValue(this.getStringControlValue(control))
						.onChange((value) => {
							this.scheduleControlValue(control.key, value, 350);
						});
					text.inputEl.addEventListener("blur", () => {
						void this.flushPendingControl(control.key);
					});
				});
				break;
			case "dropdown":
				setting.addDropdown((dropdown) => {
					for (const [value, label] of Object.entries(control.options ?? {})) {
						dropdown.addOption(value, label);
					}

					dropdown
						.setValue(this.getStringControlValue(control))
						.onChange((value) => {
							void this.setControlValue(control.key, value);
						});
				});
				break;
		}
	}

	private isGroupDefinition(
		definition: SettingDefinition,
	): definition is SettingDefinitionGroup {
		return "type" in definition && definition.type === "group";
	}

	private getBooleanControlValue(control: SettingControl): boolean {
		const value = this.getControlValue(control.key);
		return typeof value === "boolean" ? value : control.defaultValue === true;
	}

	private getStringControlValue(control: SettingControl): string {
		const value = this.getControlValue(control.key);
		return typeof value === "string"
			? value
			: typeof control.defaultValue === "string"
				? control.defaultValue
				: "";
	}

	private isVisible(visible: SettingPredicate | undefined): boolean {
		if (typeof visible === "function") {
			return visible();
		}

		return visible ?? true;
	}

	private refreshSettingsTab(): void {
		const update = (this as { update?: () => void }).update;
		if (typeof update === "function") {
			update.call(this);
			return;
		}

		this.display();
	}

	private scheduleControlValue(
		key: SettingKey,
		value: unknown,
		delayMs: number,
	): void {
		this.pendingControlValues.set(key, value);
		const currentTimer = this.controlTimers.get(key);
		if (currentTimer !== undefined) {
			window.clearTimeout(currentTimer);
		}

		const timer = window.setTimeout(() => {
			this.controlTimers.delete(key);
			void this.flushPendingControl(key);
		}, delayMs);
		this.controlTimers.set(key, timer);
	}

	private async flushPendingControl(key: SettingKey): Promise<void> {
		const timer = this.controlTimers.get(key);
		if (timer !== undefined) {
			window.clearTimeout(timer);
			this.controlTimers.delete(key);
		}

		if (!this.pendingControlValues.has(key)) {
			return;
		}

		const value = this.pendingControlValues.get(key);
		this.pendingControlValues.delete(key);
		await this.setControlValue(key, value);
	}

	private async flushPendingControls(): Promise<void> {
		await Promise.all(
			Array.from(this.pendingControlValues.keys()).map((key) =>
				this.flushPendingControl(key),
			),
		);
	}

	private cancelPendingControl(key: SettingKey): void {
		const timer = this.controlTimers.get(key);
		if (timer !== undefined) {
			window.clearTimeout(timer);
		}
		this.controlTimers.delete(key);
		this.pendingControlValues.delete(key);
	}

	private normalizeText(value: unknown, fallback: string): string {
		const text = typeof value === "string" ? value.trim() : "";
		return text || fallback;
	}

	private asOption<T extends string>(
		value: unknown,
		options: Record<T, string>,
		fallback: T,
	): T {
		return typeof value === "string" && value in options ? (value as T) : fallback;
	}
}
