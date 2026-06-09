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
	| "settings.linkedSourcePreview.name"
	| "settings.linkedSourcePreview.desc"
	| "settings.writeTagsAsObsidianTags.name"
	| "settings.writeTagsAsObsidianTags.desc"
	| "settings.dotColor.name"
	| "settings.dotColor.desc"
	| "settings.lineColor.name"
	| "settings.lineColor.desc"
	| "settings.readingView.heading"
	| "settings.showMetadata.name"
	| "settings.showMetadata.desc"
	| "settings.metadataMode.name"
	| "settings.metadataMode.desc"
	| "settings.properties.heading"
	| "settings.propertyEnrichment.name"
	| "settings.propertyEnrichment.desc"
	| "settings.dailyNotesMode.name"
	| "settings.dailyNotesMode.desc"
	| "settings.dailyNoteLinkProperty.name"
	| "settings.dailyNoteLinkProperty.desc"
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
	| "timeline.emptyTitle"
	| "timeline.emptyDescription"
	| "timeline.emptyFilteredTitle"
	| "timeline.emptyFilteredDescription"
	| "timeline.today"
	| "timeline.allDates"
	| "timeline.yesterday"
	| "timeline.thisWeek"
	| "timeline.customDate"
	| "timeline.filterBy"
	| "timeline.tagBy"
	| "timeline.sourceBy"
	| "timeline.allTags"
	| "timeline.allSources"
	| "timeline.currentNote"
	| "timeline.searchPlaceholder"
	| "timeline.startDate"
	| "timeline.endDate"
	| "timeline.emptySourceTitle"
	| "timeline.emptySourceDescription"
	| "timeline.entry"
	| "timeline.entries"
	| "timeline.invalidMetadata"
	| "timeline.linkedSource"
	| "timeline.linkedSourcePreview"
	| "timeline.linkedSourceEmpty"
	| "timeline.linkedSourceMissing"
	| "menu.openLinkedSource"
	| "notice.checkInCreated"
	| "notice.saveFailed"
	| "notice.audioUnsupported"
	| "notice.microphoneFailed"
	| "notice.openTimelineFailed"
	| "notice.noActiveSource"
	| "command.createCheckInFromSelection"
	| "command.createLinkedCheckIn"
	| "command.createLinkedCheckInFromSelection"
	| "command.addSelectionToDayline"
	| "command.addFileToDayline";

const TRANSLATIONS: Record<TimelineLanguage, Record<TranslationKey, string>> = {
	en: {
		"settings.title": "Dayline",
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
		"settings.linkedSourcePreview.name": "Show linked source preview",
		"settings.linkedSourcePreview.desc": "Show a short preview of linked Markdown files inside timeline entries.",
		"settings.writeTagsAsObsidianTags.name": "Write Dayline tags as Obsidian tags",
		"settings.writeTagsAsObsidianTags.desc": "Write entry tags as native Markdown tags so Obsidian can index them.",
		"settings.dotColor.name": "Timeline dot color",
		"settings.dotColor.desc": "Choose a custom color for timeline dots.",
		"settings.lineColor.name": "Timeline line color",
		"settings.lineColor.desc": "Choose a custom color for the line connecting timeline dots.",
		"settings.readingView.heading": "Reading view",
		"settings.showMetadata.name": "Show timeline metadata in reading view",
		"settings.showMetadata.desc": "Render hidden timeline JSON metadata inside Markdown reading view.",
		"settings.metadataMode.name": "Metadata reading view mode",
		"settings.metadataMode.desc": "Choose how metadata is displayed in Markdown reading view.",
		"settings.properties.heading": "Properties",
		"settings.propertyEnrichment.name": "Add Dayline properties",
		"settings.propertyEnrichment.desc": "Update day-file properties for Bases and Daily notes.",
		"settings.dailyNotesMode.name": "Daily notes alignment",
		"settings.dailyNotesMode.desc": "Link each Dayline day file to the matching Daily note.",
		"settings.dailyNoteLinkProperty.name": "Daily note property",
		"settings.dailyNoteLinkProperty.desc": "Property name used for the Daily note link.",
		"common.reset": "Reset",
		"common.cancel": "Cancel",
		"common.send": "Send",
		"common.search": "Search",
		"common.filter": "Filter",
		"common.closeSearch": "Close search",
		"common.closeFilter": "Close filter",
		"timeline.title": "Dayline",
		"timeline.createCheckIn": "Create check-in",
		"timeline.contentPlaceholder": "Capture what happened today...",
		"timeline.tagsPlaceholder": "# tag",
		"timeline.empty": "No check-ins match the current filters.",
		"timeline.emptyTitle": "No timeline yet",
		"timeline.emptyDescription": "Create the first check-in to start your dayline.",
		"timeline.emptyFilteredTitle": "No matching check-ins",
		"timeline.emptyFilteredDescription": "Adjust search or filters to see more timeline entries.",
		"timeline.allDates": "All",
		"timeline.today": "Today",
		"timeline.yesterday": "Yesterday",
		"timeline.thisWeek": "This week",
		"timeline.customDate": "Custom date",
		"timeline.filterBy": "Filter by",
		"timeline.tagBy": "Tag by",
		"timeline.sourceBy": "Source",
		"timeline.allTags": "All tags",
		"timeline.allSources": "All sources",
		"timeline.currentNote": "Current note",
		"timeline.searchPlaceholder": "Search text, content, tags...",
		"timeline.startDate": "Start date",
		"timeline.endDate": "End date",
		"timeline.emptySourceTitle": "No linked check-ins",
		"timeline.emptySourceDescription": "This note has no Dayline entries yet.",
		"timeline.entry": "entry",
		"timeline.entries": "entries",
		"timeline.invalidMetadata": "{count} timeline {entryWord} have invalid metadata and were skipped.",
		"timeline.linkedSource": "Linked source",
		"timeline.linkedSourcePreview": "Linked source preview",
		"timeline.linkedSourceEmpty": "Linked source has no previewable content.",
		"timeline.linkedSourceMissing": "Linked source is unavailable.",
		"menu.openLinkedSource": "Open linked source",
		"notice.checkInCreated": "1 checked in!",
		"notice.saveFailed": "Failed to save check-in.",
		"notice.audioUnsupported": "Audio recording not supported",
		"notice.microphoneFailed": "Failed to access microphone",
		"notice.openTimelineFailed": "Unable to open Dayline.",
		"notice.noActiveSource": "Open a Markdown note first.",
		"command.createCheckInFromSelection": "Create quick check-in from selection",
		"command.createLinkedCheckIn": "Create linked check-in",
		"command.createLinkedCheckInFromSelection": "Create linked check-in from selection",
		"command.addSelectionToDayline": "Add selection to Dayline",
		"command.addFileToDayline": "Add file to Dayline",
	},
	vi: {
		"settings.title": "Dayline",
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
		"settings.linkedSourcePreview.name": "Hiển thị xem trước nguồn liên kết",
		"settings.linkedSourcePreview.desc": "Hiển thị đoạn xem trước ngắn của file Markdown được liên kết trong entry timeline.",
		"settings.writeTagsAsObsidianTags.name": "Ghi tag Dayline thành tag Obsidian",
		"settings.writeTagsAsObsidianTags.desc": "Ghi tag của entry thành tag Markdown native để Obsidian có thể index.",
		"settings.dotColor.name": "Màu dot timeline",
		"settings.dotColor.desc": "Chọn màu tùy chỉnh cho dot timeline.",
		"settings.lineColor.name": "Màu line timeline",
		"settings.lineColor.desc": "Chọn màu tùy chỉnh cho đường nối các dot.",
		"settings.readingView.heading": "Reading view",
		"settings.showMetadata.name": "Hiển thị metadata timeline trong reading view",
		"settings.showMetadata.desc": "Render metadata JSON ẩn của timeline trong Markdown reading view.",
		"settings.metadataMode.name": "Kiểu hiển thị metadata",
		"settings.metadataMode.desc": "Chọn cách hiển thị metadata trong Markdown reading view.",
		"settings.properties.heading": "Properties",
		"settings.propertyEnrichment.name": "Thêm properties Dayline",
		"settings.propertyEnrichment.desc": "Cập nhật properties của file ngày để dùng với Bases và Daily notes.",
		"settings.dailyNotesMode.name": "Liên kết Daily notes",
		"settings.dailyNotesMode.desc": "Liên kết mỗi file ngày Dayline với Daily note tương ứng.",
		"settings.dailyNoteLinkProperty.name": "Property Daily note",
		"settings.dailyNoteLinkProperty.desc": "Tên property dùng cho link Daily note.",
		"common.reset": "Đặt lại",
		"common.cancel": "Hủy",
		"common.send": "Gửi",
		"common.search": "Tìm kiếm",
		"common.filter": "Bộ lọc",
		"common.closeSearch": "Đóng tìm kiếm",
		"common.closeFilter": "Đóng bộ lọc",
		"timeline.title": "Dayline",
		"timeline.createCheckIn": "Tạo check-in",
		"timeline.contentPlaceholder": "Ghi lại điều đáng nhớ hôm nay...",
		"timeline.tagsPlaceholder": "# tag",
		"timeline.empty": "Không có check-in nào khớp với bộ lọc hiện tại.",
		"timeline.emptyTitle": "Chưa có timeline",
		"timeline.emptyDescription": "Tạo check-in đầu tiên để bắt đầu dayline.",
		"timeline.emptyFilteredTitle": "Không có check-in phù hợp",
		"timeline.emptyFilteredDescription": "Điều chỉnh tìm kiếm hoặc bộ lọc để xem thêm timeline.",
		"timeline.allDates": "Tất cả",
		"timeline.today": "Hôm nay",
		"timeline.yesterday": "Hôm qua",
		"timeline.thisWeek": "Tuần này",
		"timeline.customDate": "Tuỳ chỉnh",
		"timeline.filterBy": "Lọc theo",
		"timeline.tagBy": "Tag",
		"timeline.sourceBy": "Nguồn",
		"timeline.allTags": "Tất cả",
		"timeline.allSources": "Tất cả nguồn",
		"timeline.currentNote": "Note hiện tại",
		"timeline.searchPlaceholder": "Tìm nội dung, văn bản, tag...",
		"timeline.startDate": "Ngày bắt đầu",
		"timeline.endDate": "Ngày kết thúc",
		"timeline.emptySourceTitle": "Chưa có check-in liên kết",
		"timeline.emptySourceDescription": "Note này chưa có entry Dayline.",
		"timeline.entry": "mục",
		"timeline.entries": "mục",
		"timeline.invalidMetadata": "{count} {entryWord} timeline có metadata không hợp lệ và đã bị bỏ qua.",
		"timeline.linkedSource": "Nguồn liên kết",
		"timeline.linkedSourcePreview": "Xem trước nguồn liên kết",
		"timeline.linkedSourceEmpty": "Nguồn liên kết chưa có nội dung để xem trước.",
		"timeline.linkedSourceMissing": "Không tìm thấy nguồn liên kết.",
		"menu.openLinkedSource": "Mở nguồn liên kết",
		"notice.checkInCreated": "Đã tạo 1 check-in!",
		"notice.saveFailed": "Không thể lưu check-in.",
		"notice.audioUnsupported": "Thiết bị không hỗ trợ ghi âm",
		"notice.microphoneFailed": "Không thể truy cập microphone",
		"notice.openTimelineFailed": "Không thể mở Dayline.",
		"notice.noActiveSource": "Hãy mở một note Markdown trước.",
		"command.createCheckInFromSelection": "Tạo check-in nhanh từ vùng chọn",
		"command.createLinkedCheckIn": "Tạo check-in liên kết",
		"command.createLinkedCheckInFromSelection": "Tạo check-in liên kết từ vùng chọn",
		"command.addSelectionToDayline": "Thêm vùng chọn vào Dayline",
		"command.addFileToDayline": "Thêm file vào Dayline",
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
		case "all":
			return t(language, "timeline.allDates");
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
		case "all":
			return t(language, "timeline.allDates");
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
