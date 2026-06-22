import React, { useState, useMemo, useCallback } from "react";
import { usePlugin } from "../context/PluginContext";
import {
	type TimelineFilterState,
	type TimelineDatePreset,
} from "../index/filterTimeline";
import { formatDateForFile, getNow } from "../utils/date";
import type { TimelineIndexItem } from "../models/TimelineEntry";
import type { TimelineLanguage } from "../models/TimelineSettings";
import {
	resetExpandedFilters,
	updateDatePreset,
} from "../views/timeline/utils/timelineFilterActions";
import { createTimelineEntryActions } from "../views/timeline/actions/timelineEntryActions";
import { openTimelineEntryMenu } from "../views/timeline/actions/timelineMenu";
import { mapPendingAttachmentsToInputs } from "../views/timeline/composer/composerAttachments";
import {
	hasComposerDraftChanges,
	getComposerTags,
} from "../views/timeline/composer/composerDraft";
import { TimelineToolbar } from "./toolbar/TimelineToolbar";
import {
	TimelineHeader,
	type TimelineActivePanel,
} from "./header/TimelineHeader";
import { TimelineEmptyState } from "./timeline/TimelineEmptyState";
import { TimelineList } from "./timeline/TimelineList";
import { ComposerPanel } from "./composer/ComposerPanel";
import {
	HorizontalCalendar,
	type HorizontalCalendarMarker,
} from "./calendar/HorizontalCalendar";
import { Notice, TFile } from "obsidian";
import { getErrorMessage } from "../views/timeline/utils/timelineErrors";
import { useTimelineData } from "../hooks/useTimelineData";
import { useComposerState } from "../hooks/useComposerState";
import {
	describeDatePreset,
	entryCountText,
	t,
} from "../i18n";

interface TimelineRootProps {
	refreshRevision: number;
}

function createInitialFilterState(): TimelineFilterState {
	const today = formatDateForFile(getNow());
	return {
		searchTerm: "",
		selectedTag: "",
		sourceMode: "all",
		datePreset: "today",
		customDate: today,
		customEndDate: today,
	};
}

function createCalendarMarkers(
	items: TimelineIndexItem[],
	language: TimelineLanguage,
): Record<string, HorizontalCalendarMarker[]> {
	const countsByDate = new Map<string, number>();
	for (const item of items) {
		countsByDate.set(item.date, (countsByDate.get(item.date) ?? 0) + 1);
	}

	const markersByDate: Record<string, HorizontalCalendarMarker[]> = {};
	for (const [date, count] of countsByDate) {
		markersByDate[date] = [
			{
				tone: "default",
				label: entryCountText(language, count),
			},
		];
	}

	return markersByDate;
}

function getCalendarSelectedDate(
	filters: TimelineFilterState,
	today: string,
): string {
	if (filters.datePreset === "custom" && filters.customDate) {
		return filters.customDate;
	}

	return today;
}

function getCalendarLocale(language: TimelineLanguage): string {
	return language === "vi" ? "vi-VN" : "en-US";
}

export const TimelineRoot: React.FC<TimelineRootProps> = ({
	refreshRevision,
}) => {
	const { plugin } = usePlugin();
	const language = plugin.settings.language;
	const {
		uiRevision,
		draftState,
		recordingState,
		clearDraft,
		setDraftContent,
		setTagDraft,
		commitTagDraft,
		removeTag,
		addTag,
		removeAttachment,
		addFiles,
		pasteImages,
		toggleRecording,
	} = useComposerState();

	const [filters, setFilters] = useState<TimelineFilterState>(
		createInitialFilterState,
	);

	const [activePanel, setActivePanel] =
		useState<TimelineActivePanel>(null);
	const [calendarMonth, setCalendarMonth] = useState(() =>
		formatDateForFile(getNow()).slice(0, 7),
	);
	const activeSourceFile = plugin.app.workspace.getActiveFile();
	const currentSourcePath = activeSourceFile?.path ?? "";
	const currentSourceLabel = activeSourceFile?.basename ?? "";

	const {
		allItems,
		availableTags,
		malformedEntryCount,
		today,
		filteredItems,
		activeDate,
	} = useTimelineData({
		filters,
		refreshRevision,
		uiRevision,
		currentSourcePath,
	});

	const entryActions = useMemo(
		() => createTimelineEntryActions({ plugin }),
		[plugin],
	);

	const clearSearchTerm = useCallback(() => {
		setFilters((prev: TimelineFilterState) => ({
			...prev,
			searchTerm: "",
		}));
	}, []);

	const resetTimelineFilters = useCallback(() => {
		setFilters((prev: TimelineFilterState) => {
			const newFilters = { ...prev };
			resetExpandedFilters(newFilters, today);
			return newFilters;
		});
	}, [today]);

	const handleCreateToggle = useCallback(() => {
		setActivePanel((prev: TimelineActivePanel) => {
			if (prev === "search") {
				clearSearchTerm();
			}
			if (prev === "filter") {
				resetTimelineFilters();
			}
			return prev === "composer" ? null : "composer";
		});
	}, [clearSearchTerm, resetTimelineFilters]);

	const handleSearchToggle = useCallback(() => {
		setActivePanel((prev: TimelineActivePanel) => {
			if (prev === "search") {
				clearSearchTerm();
				return null;
			}
			if (prev === "filter") {
				resetTimelineFilters();
			}
			return "search";
		});
	}, [clearSearchTerm, resetTimelineFilters]);

	const handleFilterToggle = useCallback(() => {
		setActivePanel((prev: TimelineActivePanel) => {
			if (prev === "filter") {
				resetTimelineFilters();
				return null;
			}
			if (prev === "search") {
				clearSearchTerm();
			}
			return "filter";
		});
	}, [clearSearchTerm, resetTimelineFilters]);

	const handleSearchInput = useCallback((value: string) => {
		setFilters((prev: TimelineFilterState) => ({
			...prev,
			searchTerm: value,
		}));
	}, []);

	const handleDatePresetChange = useCallback(
		(preset: TimelineDatePreset) => {
			const newFilters = { ...filters };
			updateDatePreset(newFilters, preset, today);
			setFilters(newFilters);
		},
		[filters, today],
	);

	const handleTagChange = useCallback((tag: string) => {
		setFilters((prev: TimelineFilterState) => ({
			...prev,
			selectedTag: tag,
		}));
	}, []);

	const handleSourceModeChange = useCallback(
		(sourceMode: TimelineFilterState["sourceMode"]) => {
			setFilters((prev: TimelineFilterState) => ({
				...prev,
				sourceMode,
			}));
		},
		[],
	);

	const handleCustomDateChange = useCallback((value: string) => {
		setFilters((prev: TimelineFilterState) => ({
			...prev,
			customDate: value,
		}));
	}, []);

	const handleCustomEndDateChange = useCallback((value: string) => {
		setFilters((prev: TimelineFilterState) => ({
			...prev,
			customEndDate: value,
		}));
	}, []);

	const handleCalendarDateSelect = useCallback((date: string) => {
		setCalendarMonth(date.slice(0, 7));
		setFilters((prev: TimelineFilterState) => ({
			...prev,
			datePreset: "custom",
			customDate: date,
			customEndDate: date,
		}));
	}, []);

	const handlePasteComposer = useCallback(
		async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
			await pasteImages(event.nativeEvent);
		},
		[pasteImages],
	);

	const handleCancelComposer = useCallback(() => {
		setActivePanel(null);
		clearDraft();
	}, [clearDraft]);

	const handleSubmitComposer = useCallback(async () => {
		if (!hasComposerDraftChanges(draftState)) return;

		const tags = getComposerTags(draftState);
		const content = draftState.content.trim();

		try {
			const inputs = mapPendingAttachmentsToInputs(
				draftState.attachments,
			);

			const draft = { content, tags };
			const result = await plugin.timelineRepository.createTextEntry(
				draft,
				getNow(),
				inputs,
			);
			await plugin.timelineIndex.refreshFile(result.file);
			await plugin.refreshTimelineViews();

			new Notice(t(language, "notice.checkInCreated"));
			setActivePanel(null);
			clearDraft();
		} catch (error) {
			new Notice(getErrorMessage(error, t(language, "notice.saveFailed")));
			console.error(error);
		}
	}, [draftState, plugin, clearDraft, language]);

	const handleTagToggle = useCallback((tag: string) => {
		setFilters((prev: TimelineFilterState) => ({
			...prev,
			selectedTag: prev.selectedTag === tag ? "" : tag,
		}));
	}, []);

	const handleOpenMenu = useCallback(
		(event: React.MouseEvent, item: TimelineIndexItem) => {
			openTimelineEntryMenu(event.nativeEvent, item, entryActions, language);
		},
		[entryActions, language],
	);

	const handleOpenLinkedSource = useCallback(
		async (item: TimelineIndexItem) => {
			if (!item.sourceContext) return;
			await plugin.openSourceContext(item.sourceContext);
		},
		[plugin],
	);

	const handleTaskToggle = useCallback(
		async (
			item: TimelineIndexItem,
			taskIndex: number,
			checked: boolean,
		) => {
			const success = await plugin.timelineRepository.toggleTaskInEntry(
				item.sourcePath,
				item.id,
				taskIndex,
				checked,
			);
			if (success) {
				const sourceFile =
					plugin.app.vault.getAbstractFileByPath(item.sourcePath);
				if (sourceFile instanceof TFile) {
					await plugin.timelineIndex.refreshFile(sourceFile);
					await plugin.refreshTimelineViews();
				}
			}
		},
		[plugin],
	);

	const rootStyle = {
		...(plugin.settings.timelineDotColor
			? { "--pt-dot-color": plugin.settings.timelineDotColor }
			: {}),
		...(plugin.settings.timelineLineColor
			? { "--pt-line-color": plugin.settings.timelineLineColor }
			: {}),
	} as React.CSSProperties;
	const calendarMarkersByDate = useMemo(
		() => createCalendarMarkers(allItems, language),
		[allItems, language],
	);
	const selectedCalendarDate = getCalendarSelectedDate(filters, today);
	const shouldShowCalendar =
		plugin.settings.showTimelineCalendar && activePanel === null;

	return (
		<div
			className="dayline-view timeline-react-root"
			style={rootStyle}
		>
			<TimelineHeader
				language={language}
				subtitle={describeDatePreset(language, filters, activeDate)}
				activePanel={activePanel}
				onCreateToggle={handleCreateToggle}
				onSearchToggle={handleSearchToggle}
				onFilterToggle={handleFilterToggle}
			/>

			{malformedEntryCount > 0 && (
				<div className="timeline-warning-banner">
					{t(language, "timeline.invalidMetadata", {
						count: malformedEntryCount,
						entryWord: t(
							language,
							malformedEntryCount === 1
								? "timeline.entry"
								: "timeline.entries",
						),
					})}
				</div>
			)}

			{shouldShowCalendar && (
				<div className="timeline-calendar-panel">
					<HorizontalCalendar
						month={calendarMonth}
						selectedDate={selectedCalendarDate}
						today={today}
						markersByDate={calendarMarkersByDate}
						locale={getCalendarLocale(language)}
						labels={{
							ariaLabel: t(language, "timeline.calendarAriaLabel"),
							nextMonth: t(language, "timeline.nextMonth"),
							previousMonth: t(language, "timeline.previousMonth"),
							today: t(language, "timeline.today"),
						}}
						weekdayFormat="short"
						maxVisibleMarkers={1}
						onMonthChange={setCalendarMonth}
						onSelectDate={handleCalendarDateSelect}
					/>
				</div>
			)}

			{activePanel === "composer" && (
				<ComposerPanel
					rootClassName="timeline-composer"
					contentPlaceholder={t(language, "timeline.contentPlaceholder")}
					tagsPlaceholder={t(language, "timeline.tagsPlaceholder")}
					cancelLabel={t(language, "common.cancel")}
					submitLabel={t(language, "common.send")}
					draftState={draftState}
					recordingState={recordingState}
					availableTags={availableTags}
					onContentChange={setDraftContent}
					onTagDraftChange={setTagDraft}
					onCommitTagDraft={commitTagDraft}
					onRemoveTag={removeTag}
					onAddTag={addTag}
					onRemoveAttachment={removeAttachment}
					onAddFiles={addFiles}
					onPaste={handlePasteComposer}
					onToggleRecording={() => {
						void toggleRecording();
					}}
					onCancel={handleCancelComposer}
					onSubmit={handleSubmitComposer}
				/>
			)}

			<TimelineToolbar
				filters={filters}
				today={today}
				language={language}
				isSearchExpanded={activePanel === "search"}
				isFilterExpanded={activePanel === "filter"}
				availableTags={availableTags}
				currentSourceLabel={currentSourceLabel}
				onSearchInput={handleSearchInput}
				onDatePresetChange={handleDatePresetChange}
				onTagChange={handleTagChange}
				onSourceModeChange={handleSourceModeChange}
				onCustomDateChange={handleCustomDateChange}
				onCustomEndDateChange={handleCustomEndDateChange}
			/>

			<div className="timeline-list-section">
				<div className="timeline-list-summary">
					{describeDatePreset(language, filters, activeDate)} ·{" "}
					{entryCountText(language, filteredItems.length)}
				</div>

				{filteredItems.length === 0 ? (
					<TimelineEmptyState
						language={language}
						hasTimelineEntries={allItems.length > 0}
						isCurrentSourceFilter={filters.sourceMode === "current"}
						onCreateCheckIn={handleCreateToggle}
					/>
				) : (
					<TimelineList
						items={filteredItems}
						today={today}
						language={language}
						selectedTag={filters.selectedTag}
						renderMarkdown={
							plugin.settings.renderTimelineContentMarkdown
						}
						showLinkedSourcePreview={
							plugin.settings.showLinkedSourcePreview
						}
						refreshRevision={refreshRevision}
						onTagToggle={handleTagToggle}
						onOpenSource={(item) => {
							void handleOpenLinkedSource(item);
						}}
						onOpenMenu={handleOpenMenu}
						onTaskToggle={(item, taskIndex, checked) => {
							void handleTaskToggle(item, taskIndex, checked);
						}}
					/>
				)}
			</div>
		</div>
	);
};
