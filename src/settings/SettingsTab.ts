import { App, PluginSettingTab, Setting } from "obsidian";

import type DaylinePlugin from "../main";
import type {
	TimelineDefaultView,
	TimelineDailyNotesMode,
	TimelineFileOrganization,
	TimelineLanguage,
	TimelineMetadataReadingViewMode,
	TimelineTimeFormat,
} from "../models/TimelineSettings";
import { LANGUAGE_OPTIONS, t } from "../i18n";

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

export class TimelineSettingTab extends PluginSettingTab {
	plugin: DaylinePlugin;

	constructor(app: App, plugin: DaylinePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		const language = this.plugin.settings.language;

		new Setting(containerEl).setName(t(language, "settings.title")).setHeading();

		new Setting(containerEl)
			.setName(t(language, "settings.language.name"))
			.setDesc(t(language, "settings.language.desc"))
			.addDropdown((dropdown) => {
				for (const [value, label] of Object.entries(LANGUAGE_OPTIONS)) {
					dropdown.addOption(value, label);
				}

				dropdown
					.setValue(this.plugin.settings.language)
					.onChange(async (value: TimelineLanguage) => {
						this.plugin.settings.language = value;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		new Setting(containerEl).setName(t(language, "settings.storage.heading")).setHeading();

		new Setting(containerEl)
			.setName(t(language, "settings.timelineFolder.name"))
			.setDesc(t(language, "settings.timelineFolder.desc"))
			.addText((text) =>
				text
					.setPlaceholder("Timeline")
					.setValue(this.plugin.settings.timelineFolder)
					.onChange(async (value) => {
						this.plugin.settings.timelineFolder = value.trim() || "Timeline";
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t(language, "settings.attachmentFolder.name"))
			.setDesc(t(language, "settings.attachmentFolder.desc"))
			.addText((text) =>
					text
						.setPlaceholder("Timeline attachments")
						.setValue(this.plugin.settings.attachmentFolder)
					.onChange(async (value) => {
						this.plugin.settings.attachmentFolder =
							value.trim() || "Timeline Attachments";
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t(language, "settings.fileOrganization.name"))
			.setDesc(t(language, "settings.fileOrganization.desc"))
			.addDropdown((dropdown) => {
				for (const [value, label] of Object.entries(FILE_ORGANIZATION_OPTIONS)) {
					dropdown.addOption(value, label);
				}

				dropdown
					.setValue(this.plugin.settings.fileOrganization)
					.onChange(async (value: TimelineFileOrganization) => {
						this.plugin.settings.fileOrganization = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t(language, "settings.defaultView.name"))
			.setDesc(t(language, "settings.defaultView.desc"))
			.addDropdown((dropdown) => {
				for (const [value, label] of Object.entries(DEFAULT_VIEW_OPTIONS)) {
					dropdown.addOption(value, label);
				}

				dropdown
					.setValue(this.plugin.settings.defaultView)
					.onChange(async (value: TimelineDefaultView) => {
						this.plugin.settings.defaultView = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t(language, "settings.timeFormat.name"))
			.setDesc(t(language, "settings.timeFormat.desc"))
			.addDropdown((dropdown) => {
				for (const [value, label] of Object.entries(TIME_FORMAT_OPTIONS)) {
					dropdown.addOption(value, label);
				}

				dropdown
					.setValue(this.plugin.settings.timeFormat)
					.onChange(async (value: TimelineTimeFormat) => {
						this.plugin.settings.timeFormat = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl).setName(t(language, "settings.timelineView.heading")).setHeading();

		new Setting(containerEl)
			.setName(t(language, "settings.renderMarkdown.name"))
			.setDesc(t(language, "settings.renderMarkdown.desc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.renderTimelineContentMarkdown)
					.onChange(async (value) => {
						this.plugin.settings.renderTimelineContentMarkdown = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t(language, "settings.dotColor.name"))
			.setDesc(t(language, "settings.dotColor.desc"))
			.addColorPicker((picker) =>
				picker
					.setValue(this.plugin.settings.timelineDotColor || "#000000")
					.onChange(async (value) => {
						this.plugin.settings.timelineDotColor = value;
						await this.plugin.saveSettings();
					}),
			)
			.addButton((button) =>
				button
					.setButtonText(t(language, "common.reset"))
					.onClick(async () => {
						this.plugin.settings.timelineDotColor = "";
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		new Setting(containerEl)
			.setName(t(language, "settings.lineColor.name"))
			.setDesc(t(language, "settings.lineColor.desc"))
			.addColorPicker((picker) =>
				picker
					.setValue(this.plugin.settings.timelineLineColor || "#000000")
					.onChange(async (value) => {
						this.plugin.settings.timelineLineColor = value;
						await this.plugin.saveSettings();
					}),
			)
			.addButton((button) =>
				button
					.setButtonText(t(language, "common.reset"))
					.onClick(async () => {
						this.plugin.settings.timelineLineColor = "";
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		new Setting(containerEl).setName(t(language, "settings.readingView.heading")).setHeading();

		new Setting(containerEl)
			.setName(t(language, "settings.showMetadata.name"))
			.setDesc(t(language, "settings.showMetadata.desc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showMetadataInReadingView)
					.onChange(async (value) => {
						this.plugin.settings.showMetadataInReadingView = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t(language, "settings.metadataMode.name"))
			.setDesc(t(language, "settings.metadataMode.desc"))
			.addDropdown((dropdown) => {
				for (const [value, label] of Object.entries(METADATA_READING_VIEW_OPTIONS)) {
					dropdown.addOption(value, label);
				}

				dropdown
					.setValue(this.plugin.settings.metadataReadingViewMode)
					.onChange(async (value: TimelineMetadataReadingViewMode) => {
						this.plugin.settings.metadataReadingViewMode = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl).setName(t(language, "settings.properties.heading")).setHeading();

		new Setting(containerEl)
			.setName(t(language, "settings.propertyEnrichment.name"))
			.setDesc(t(language, "settings.propertyEnrichment.desc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.propertyEnrichmentEnabled)
					.onChange(async (value) => {
						this.plugin.settings.propertyEnrichmentEnabled = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t(language, "settings.dailyNotesMode.name"))
			.setDesc(t(language, "settings.dailyNotesMode.desc"))
			.addDropdown((dropdown) => {
				for (const [value, label] of Object.entries(DAILY_NOTES_MODE_OPTIONS)) {
					dropdown.addOption(value, label);
				}

				dropdown
					.setValue(this.plugin.settings.dailyNotesMode)
					.onChange(async (value: TimelineDailyNotesMode) => {
						this.plugin.settings.dailyNotesMode = value;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		if (this.plugin.settings.dailyNotesMode === "link") {
			new Setting(containerEl)
				.setName(t(language, "settings.dailyNoteLinkProperty.name"))
				.setDesc(t(language, "settings.dailyNoteLinkProperty.desc"))
				.addText((text) =>
					text
						.setPlaceholder("Daily note")
						.setValue(this.plugin.settings.dailyNoteLinkProperty)
						.onChange(async (value) => {
							this.plugin.settings.dailyNoteLinkProperty =
								value.trim() || "daily_note";
							await this.plugin.saveSettings();
						}),
				);
		}
	}
}
