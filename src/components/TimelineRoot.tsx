import React, { useState, useMemo, useCallback } from "react";
import { usePlugin } from "../context/PluginContext";
import {
	type TimelineFilterState,
	type TimelineDatePreset,
} from "../index/filterTimeline";
import { formatDateForFile, getNow } from "../utils/date";
import type { TimelineIndexItem } from "../models/TimelineEntry";
import { describeDatePreset } from "../views/timeline/utils/timelineDates";
import {
	resetExpandedFilters,
	updateDatePreset,
} from "../views/timeline/utils/timelineFilterActions";
import { createTimelineEntryActions } from "../views/timeline/actions/timelineEntryActions";
import { openTimelineEntryMenu } from "../views/timeline/actions/timelineMenu";
import { mapPendingAttachmentsToInputs } from "../views/timeline/composer/composerAttachments";
import {
	commitComposerTagDraft,
	removeComposerTag,
	hasComposerDraftChanges,
	getComposerTags,
} from "../views/timeline/composer/composerDraft";
import { TimelineToolbar } from "./toolbar/TimelineToolbar";
import { TimelineList } from "./timeline/TimelineList";
import { ComposerPanel } from "./composer/ComposerPanel";
import { Notice, TFile } from "obsidian";
import { getErrorMessage } from "../views/timeline/utils/timelineErrors";
import { useTimelineData } from "../hooks/useTimelineData";
import { useComposerState } from "../hooks/useComposerState";

interface TimelineRootProps {
	refreshRevision: number;
}

export const TimelineRoot: React.FC<TimelineRootProps> = ({
	refreshRevision,
}) => {
	const { plugin } = usePlugin();
	const {
		uiRevision,
		draftState,
		recordingState,
		bumpUiRevision,
		clearDraft,
		addFiles,
		toggleRecording,
	} = useComposerState();

	const [filters, setFilters] = useState<TimelineFilterState>({
		searchTerm: "",
		selectedTag: "",
		startTime: "",
		endTime: "",
		datePreset: "today",
		customDate: formatDateForFile(getNow()),
	});

	const [isComposerExpanded, setIsComposerExpanded] = useState(false);
	const [isSearchExpanded, setIsSearchExpanded] = useState(false);
	const [isFilterExpanded, setIsFilterExpanded] = useState(false);

	const {
		availableTags,
		malformedEntryCount,
		today,
		filteredItems,
		activeDate,
	} = useTimelineData({ filters, refreshRevision, uiRevision });

	const entryActions = useMemo(
		() => createTimelineEntryActions({ plugin }),
		[plugin],
	);

	const handleSearchToggle = useCallback(() => {
		setIsSearchExpanded((prev: boolean) => !prev);
		if (isSearchExpanded && filters.searchTerm) {
			setFilters((prev: TimelineFilterState) => ({
				...prev,
				searchTerm: "",
			}));
		}
	}, [isSearchExpanded, filters.searchTerm]);

	const handleFilterToggle = useCallback(() => {
		if (isFilterExpanded) {
			const newFilters = { ...filters };
			resetExpandedFilters(newFilters, today);
			setFilters(newFilters);
		}
		setIsFilterExpanded((prev: boolean) => !prev);
	}, [isFilterExpanded, filters, today]);

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

	const handleCustomDateChange = useCallback((value: string) => {
		setFilters((prev: TimelineFilterState) => ({
			...prev,
			customDate: value,
		}));
	}, []);

	const handleStartTimeChange = useCallback((value: string) => {
		setFilters((prev: TimelineFilterState) => ({
			...prev,
			startTime: value,
		}));
	}, []);

	const handleEndTimeChange = useCallback((value: string) => {
		setFilters((prev: TimelineFilterState) => ({
			...prev,
			endTime: value,
		}));
	}, []);

	const handleCommitTagDraft = useCallback(() => {
		return commitComposerTagDraft(draftState);
	}, [draftState]);

	const handleRemoveTag = useCallback(
		(tag: string) => {
			removeComposerTag(draftState, tag);
		},
		[draftState],
	);

	const handleCancelComposer = useCallback(() => {
		setIsComposerExpanded(false);
		clearDraft();
	}, [clearDraft]);

	const handleSubmitComposer = useCallback(async () => {
		if (!hasComposerDraftChanges(draftState)) return;

		const tags = getComposerTags(draftState);
		const content = draftState.content.trim();

		try {
			const activeDateStr = activeDate;
			let checkInDate = getNow();
			if (activeDateStr && activeDateStr !== today) {
				const [year, month, day] = activeDateStr.split("-").map(Number);
				if (year && month && day) {
					checkInDate = new Date(year, month - 1, day, 12, 0, 0);
				}
			}

			const inputs = mapPendingAttachmentsToInputs(
				draftState.attachments,
			);

			const draft = { content, tags };
			const result = await plugin.timelineRepository.createTextEntry(
				draft,
				checkInDate,
				inputs,
			);
			await plugin.timelineIndex.refreshFile(result.file);
			await plugin.refreshTimelineViews();

			new Notice(`1 checked in!`);
			setIsComposerExpanded(false);
			clearDraft();
		} catch (error) {
			new Notice(getErrorMessage(error, "Failed to save check-in."));
			console.error(error);
		}
	}, [draftState, activeDate, today, plugin, clearDraft]);

	const handleTagToggle = useCallback((tag: string) => {
		setFilters((prev: TimelineFilterState) => ({
			...prev,
			selectedTag: prev.selectedTag === tag ? "" : tag,
		}));
	}, []);

	const handleOpenMenu = useCallback(
		(event: React.MouseEvent, item: TimelineIndexItem) => {
			openTimelineEntryMenu(event.nativeEvent, item, entryActions);
		},
		[entryActions],
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

	return (
		<div className="personal-timeline-view timeline-react-root">
			<div className="timeline-header">
				<div className="timeline-header-text">
					<h2>Personal timeline</h2>
					<div className="timeline-date-label">
						{describeDatePreset(filters, activeDate)}
					</div>
				</div>
				<button
					className="timeline-header-button"
					type="button"
					aria-label="Create check-in"
					onClick={() => setIsComposerExpanded(true)}
				>
					+
				</button>
			</div>

			{malformedEntryCount > 0 && (
				<div className="timeline-warning-banner">
					{malformedEntryCount} timeline entr
					{malformedEntryCount === 1 ? "y has" : "ies have"} invalid
					metadata and {malformedEntryCount === 1 ? "was" : "were"}{" "}
					skipped.
				</div>
			)}

			{isComposerExpanded && (
				<ComposerPanel
					rootClassName="timeline-composer"
					contentPlaceholder="Hãy nhập"
					tagsPlaceholder="# Add tags"
					cancelLabel="Cancel"
					submitLabel="Send"
					draftState={draftState}
					recordingState={recordingState}
					onDraftRefresh={bumpUiRevision}
					onCommitTagDraft={handleCommitTagDraft}
					onRemoveTag={handleRemoveTag}
					onAddFiles={addFiles}
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
				summaryText={`${describeDatePreset(filters, activeDate)} · ${filteredItems.length} entr${filteredItems.length === 1 ? "y" : "ies"}`}
				isSearchExpanded={isSearchExpanded}
				isFilterExpanded={isFilterExpanded}
				availableTags={availableTags}
				onSearchToggle={handleSearchToggle}
				onFilterToggle={handleFilterToggle}
				onSearchInput={handleSearchInput}
					onDatePresetChange={handleDatePresetChange}
				onTagChange={handleTagChange}
				onCustomDateChange={handleCustomDateChange}
				onStartTimeChange={handleStartTimeChange}
				onEndTimeChange={handleEndTimeChange}
			/>

			<div className="timeline-list-section">
				<div className="timeline-list-summary">
					{describeDatePreset(filters, activeDate)} ·{" "}
					{filteredItems.length} entr
					{filteredItems.length === 1 ? "y" : "ies"}
				</div>

				{filteredItems.length === 0 ? (
					<p className="timeline-empty-state">
						No check-ins match the current filters.
					</p>
				) : (
					<TimelineList
						items={filteredItems}
						today={today}
							selectedTag={filters.selectedTag}
							onTagToggle={handleTagToggle}
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
