import type { TimelineLanguage } from "./models/TimelineSettings";
import type { TimelineDatePreset, TimelineFilterState } from "./index/filterTimeline";

type TranslationKey =
	| "settings.title"
	| "settings.language.name"
	| "settings.language.desc"
	| "settings.storage.heading"
	| "settings.timelineFolder.name"
	| "settings.timelineFolder.desc"
	| "settings.attachmentFolder.name"
	| "settings.attachmentFolder.desc"
	| "settings.fileOrganization.name"
	| "settings.fileOrganization.desc"
	| "settings.defaultView.name"
	| "settings.defaultView.desc"
	| "settings.timeFormat.name"
	| "settings.timeFormat.desc"
	| "settings.timelineView.heading"
	| "settings.renderMarkdown.name"
	| "settings.renderMarkdown.desc"
	| "settings.dotColor.name"
	| "settings.dotColor.desc"
	| "settings.lineColor.name"
	| "settings.lineColor.desc"
	| "settings.readingView.heading"
	| "settings.showMetadata.name"
	| "settings.showMetadata.desc"
	| "settings.metadataMode.name"
	| "settings.metadataMode.desc"
	| "common.reset"
	| "common.cancel"
	| "common.send"
	| "common.search"
	| "common.filter"
	| "common.closeSearch"
	| "common.closeFilter"
	| "timeline.title"
	| "timeline.createCheckIn"
	| "timeline.contentPlaceholder"
	| "timeline.tagsPlaceholder"
	| "timeline.empty"
	| "timeline.today"
	| "timeline.yesterday"
	| "timeline.thisWeek"
	| "timeline.customDate"
	| "timeline.allTags"
	| "timeline.searchPlaceholder"
	| "timeline.entry"
	| "timeline.entries"
	| "timeline.invalidMetadata"
	| "notice.checkInCreated"
	| "notice.saveFailed"
	| "notice.audioUnsupported"
	| "notice.microphoneFailed"
	| "notice.openTimelineFailed"
	| "command.createCheckInFromSelection";

const TRANSLATIONS: Record<TimelineLanguage, Record<TranslationKey, string>> = {
	en: {
		"settings.title": "Personal timeline",
		"settings.language.name": "Language",
		"settings.language.desc": "Choose the plugin display language.",
		"settings.storage.heading": "Storage",
		"settings.timelineFolder.name": "Timeline folder",
		"settings.timelineFolder.desc": "Folder used to store daily timeline Markdown files.",
		"settings.attachmentFolder.name": "Attachment folder",
		"settings.attachmentFolder.desc": "Folder used to store image, audio, and file attachments.",
		"settings.fileOrganization.name": "File organization",
		"settings.fileOrganization.desc": "Choose how timeline files are grouped inside the vault.",
		"settings.defaultView.name": "Default view",
		"settings.defaultView.desc": "Choose which day opens when the timeline view is shown.",
		"settings.timeFormat.name": "Time format",
		"settings.timeFormat.desc": "Choose how times should be displayed in the plugin UI.",
		"settings.timelineView.heading": "Timeline view",
		"settings.renderMarkdown.name": "Render content as Markdown",
		"settings.renderMarkdown.desc": "Render timeline entry content with Obsidian Markdown rendering. When disabled, content is shown as plain text.",
		"settings.dotColor.name": "Timeline dot color",
		"settings.dotColor.desc": "Choose a custom color for timeline dots.",
		"settings.lineColor.name": "Timeline line color",
		"settings.lineColor.desc": "Choose a custom color for the line connecting timeline dots.",
		"settings.readingView.heading": "Reading view",
		"settings.showMetadata.name": "Show timeline metadata in reading view",
		"settings.showMetadata.desc": "Render hidden timeline JSON metadata inside Markdown reading view.",
		"settings.metadataMode.name": "Metadata reading view mode",
		"settings.metadataMode.desc": "Choose how metadata is displayed in Markdown reading view.",
		"common.reset": "Reset",
		"common.cancel": "Cancel",
		"common.send": "Send",
		"common.search": "Search",
		"common.filter": "Filter",
		"common.closeSearch": "Close search",
		"common.closeFilter": "Close filter",
		"timeline.title": "Personal timeline",
		"timeline.createCheckIn": "Create check-in",
		"timeline.contentPlaceholder": "Write something",
		"timeline.tagsPlaceholder": "# Add tags",
		"timeline.empty": "No check-ins match the current filters.",
		"timeline.today": "Today",
		"timeline.yesterday": "Yesterday",
		"timeline.thisWeek": "This week",
		"timeline.customDate": "Custom date",
		"timeline.allTags": "All tags",
		"timeline.searchPlaceholder": "Search text, content, tags...",
		"timeline.entry": "entry",
		"timeline.entries": "entries",
		"timeline.invalidMetadata": "{count} timeline {entryWord} have invalid metadata and were skipped.",
		"notice.checkInCreated": "1 checked in!",
		"notice.saveFailed": "Failed to save check-in.",
		"notice.audioUnsupported": "Audio recording not supported",
		"notice.microphoneFailed": "Failed to access microphone",
		"notice.openTimelineFailed": "Unable to open the personal timeline view.",
		"command.createCheckInFromSelection": "Create quick check-in from selection",
	},
	vi: {
		"settings.title": "Dòng thời gian cá nhân",
		"settings.language.name": "Ngôn ngữ",
		"settings.language.desc": "Chọn ngôn ngữ hiển thị của plugin.",
		"settings.storage.heading": "Lưu trữ",
		"settings.timelineFolder.name": "Thư mục timeline",
		"settings.timelineFolder.desc": "Thư mục lưu các file Markdown timeline hằng ngày.",
		"settings.attachmentFolder.name": "Thư mục tệp đính kèm",
		"settings.attachmentFolder.desc": "Thư mục lưu ảnh, âm thanh và tệp đính kèm.",
		"settings.fileOrganization.name": "Cách tổ chức file",
		"settings.fileOrganization.desc": "Chọn cách nhóm file timeline trong vault.",
		"settings.defaultView.name": "Màn hình mặc định",
		"settings.defaultView.desc": "Chọn ngày được mở khi hiển thị timeline.",
		"settings.timeFormat.name": "Định dạng thời gian",
		"settings.timeFormat.desc": "Chọn cách hiển thị thời gian trong plugin.",
		"settings.timelineView.heading": "Giao diện timeline",
		"settings.renderMarkdown.name": "Hiển thị nội dung bằng Markdown",
		"settings.renderMarkdown.desc": "Render nội dung entry bằng Markdown của Obsidian. Khi tắt, nội dung hiển thị dạng văn bản thường.",
		"settings.dotColor.name": "Màu dot timeline",
		"settings.dotColor.desc": "Chọn màu tùy chỉnh cho dot timeline.",
		"settings.lineColor.name": "Màu line timeline",
		"settings.lineColor.desc": "Chọn màu tùy chỉnh cho đường nối các dot.",
		"settings.readingView.heading": "Reading view",
		"settings.showMetadata.name": "Hiển thị metadata timeline trong reading view",
		"settings.showMetadata.desc": "Render metadata JSON ẩn của timeline trong Markdown reading view.",
		"settings.metadataMode.name": "Kiểu hiển thị metadata",
		"settings.metadataMode.desc": "Chọn cách hiển thị metadata trong Markdown reading view.",
		"common.reset": "Đặt lại",
		"common.cancel": "Hủy",
		"common.send": "Gửi",
		"common.search": "Tìm kiếm",
		"common.filter": "Bộ lọc",
		"common.closeSearch": "Đóng tìm kiếm",
		"common.closeFilter": "Đóng bộ lọc",
		"timeline.title": "Dòng thời gian cá nhân",
		"timeline.createCheckIn": "Tạo check-in",
		"timeline.contentPlaceholder": "Viết nội dung",
		"timeline.tagsPlaceholder": "# Thêm tag",
		"timeline.empty": "Không có check-in nào khớp với bộ lọc hiện tại.",
		"timeline.today": "Hôm nay",
		"timeline.yesterday": "Hôm qua",
		"timeline.thisWeek": "Tuần này",
		"timeline.customDate": "Ngày tùy chọn",
		"timeline.allTags": "Tất cả tag",
		"timeline.searchPlaceholder": "Tìm nội dung, văn bản, tag...",
		"timeline.entry": "mục",
		"timeline.entries": "mục",
		"timeline.invalidMetadata": "{count} {entryWord} timeline có metadata không hợp lệ và đã bị bỏ qua.",
		"notice.checkInCreated": "Đã tạo 1 check-in!",
		"notice.saveFailed": "Không thể lưu check-in.",
		"notice.audioUnsupported": "Thiết bị không hỗ trợ ghi âm",
		"notice.microphoneFailed": "Không thể truy cập microphone",
		"notice.openTimelineFailed": "Không thể mở timeline cá nhân.",
		"command.createCheckInFromSelection": "Tạo check-in nhanh từ vùng chọn",
	},
};

export const LANGUAGE_OPTIONS: Record<TimelineLanguage, string> = {
	en: "English",
	vi: "Tiếng Việt",
};

export function t(
	language: TimelineLanguage,
	key: TranslationKey,
	values: Record<string, string | number> = {},
): string {
	let text = TRANSLATIONS[language][key] ?? TRANSLATIONS.en[key];
	for (const [name, value] of Object.entries(values)) {
		text = text.split(`{${name}}`).join(String(value));
	}
	return text;
}

export function entryCountText(language: TimelineLanguage, count: number): string {
	const key = count === 1 ? "timeline.entry" : "timeline.entries";
	return `${count} ${t(language, key)}`;
}

export function describeDatePreset(
	language: TimelineLanguage,
	filters: TimelineFilterState,
	activeDate: string,
): string {
	switch (filters.datePreset) {
		case "today":
			return t(language, "timeline.today");
		case "yesterday":
			return t(language, "timeline.yesterday");
		case "this-week":
			return t(language, "timeline.thisWeek");
		case "custom":
			return activeDate;
		default:
			return activeDate;
	}
}

export function datePresetLabel(
	language: TimelineLanguage,
	preset: TimelineDatePreset,
): string {
	switch (preset) {
		case "today":
			return t(language, "timeline.today");
		case "yesterday":
			return t(language, "timeline.yesterday");
		case "this-week":
			return t(language, "timeline.thisWeek");
		case "custom":
			return t(language, "timeline.customDate");
	}
}

export function dayHeader(language: TimelineLanguage, date: string, today: string): string {
	if (date === today) {
		return t(language, "timeline.today");
	}
	const [year, month, day] = date.split("-");
	return `${Number(day)}/${Number(month)}/${year}`;
}
