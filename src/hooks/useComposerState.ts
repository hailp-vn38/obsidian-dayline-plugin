import { useCallback, useEffect, useState } from "react";
import { Notice } from "obsidian";

import type {
	ComposerDraftState,
	ComposerFileTypeHint,
	ComposerRecordingState,
} from "../views/timeline/composer/composerTypes";
import {
	appendPendingFiles,
	appendPastedImages,
	releasePendingAttachmentPreviews,
	removePendingAttachment,
} from "../views/timeline/composer/composerAttachments";
import {
	addComposerTag,
	commitComposerTagDraft,
	removeComposerTag,
} from "../views/timeline/composer/composerDraft";
import {
	startComposerRecording,
	stopComposerRecording,
	stopComposerRecordingTracks,
} from "../views/timeline/composer/composerRecording";

function createEmptyDraftState(): ComposerDraftState {
	return {
		content: "",
		tagsValue: "",
		tagDraft: "",
		attachments: [],
	};
}

export function useComposerState() {
	const [uiRevision, setUiRevision] = useState(0);
	const [draftState, setDraftState] = useState<ComposerDraftState>(
		createEmptyDraftState,
	);
	const [recordingState] = useState<ComposerRecordingState>({
		mediaRecorder: null,
		audioChunks: [],
		isRecording: false,
	});

	const bumpUiRevision = useCallback(() => {
		setUiRevision((revision) => revision + 1);
	}, []);

	const clearDraft = useCallback(() => {
		stopComposerRecordingTracks(recordingState);
		releasePendingAttachmentPreviews(draftState.attachments);
		setDraftState(createEmptyDraftState());
		bumpUiRevision();
	}, [recordingState, draftState, bumpUiRevision]);

	const setDraftContent = useCallback(
		(content: string) => {
			setDraftState((prev) => ({
				...prev,
				content,
			}));
			bumpUiRevision();
		},
		[bumpUiRevision],
	);

	const setTagDraft = useCallback(
		(tagDraft: string) => {
			setDraftState((prev) => ({
				...prev,
				tagDraft,
			}));
			bumpUiRevision();
		},
		[bumpUiRevision],
	);

	const commitTagDraft = useCallback(() => {
		setDraftState((prev) => {
			const next = { ...prev, attachments: prev.attachments };
			commitComposerTagDraft(next);
			if (
				next.tagsValue === prev.tagsValue &&
				next.tagDraft === prev.tagDraft
			) {
				return prev;
			}

			bumpUiRevision();
			return next;
		});
	}, [bumpUiRevision]);

	const removeTag = useCallback(
		(tag: string) => {
			setDraftState((prev) => {
				const next = { ...prev, attachments: prev.attachments };
				removeComposerTag(next, tag);
				if (next.tagsValue === prev.tagsValue) {
					return prev;
				}

				bumpUiRevision();
				return next;
			});
		},
		[bumpUiRevision],
	);

	const addTag = useCallback(
		(tag: string) => {
			setDraftState((prev) => {
				const next = { ...prev, attachments: prev.attachments };
				addComposerTag(next, tag);
				if (next.tagsValue === prev.tagsValue) {
					return prev;
				}

				bumpUiRevision();
				return next;
			});
		},
		[bumpUiRevision],
	);

	const removeAttachment = useCallback(
		(index: number) => {
			setDraftState((prev) => {
				const attachments = [...prev.attachments];
				if (!removePendingAttachment(attachments, index)) {
					return prev;
				}

				bumpUiRevision();
				return {
					...prev,
					attachments,
				};
			});
		},
		[bumpUiRevision],
	);

	const addFiles = useCallback(
		async (files: FileList | File[], typeHint: ComposerFileTypeHint) => {
			const attachments: ComposerDraftState["attachments"] = [];
			await appendPendingFiles(
				attachments,
				Array.from(files),
				typeHint,
			);
			setDraftState((prev) => ({
				...prev,
				attachments: [...prev.attachments, ...attachments],
			}));
			bumpUiRevision();
		},
		[bumpUiRevision],
	);

	const pasteImages = useCallback(
		async (event: ClipboardEvent) => {
			const attachments: ComposerDraftState["attachments"] = [];
			const hasPastedImages = await appendPastedImages(
				attachments,
				event,
			);
			if (hasPastedImages) {
				setDraftState((prev) => ({
					...prev,
					attachments: [...prev.attachments, ...attachments],
				}));
				bumpUiRevision();
			}
		},
		[bumpUiRevision],
	);

	const toggleRecording = useCallback(async () => {
		if (recordingState.isRecording) {
			stopComposerRecording(recordingState);
			bumpUiRevision();
			return;
		}

		await startComposerRecording({
			state: recordingState,
			onUnsupported: () => {
				new Notice("Audio recording not supported");
			},
			onError: () => {
				new Notice("Failed to access microphone");
				recordingState.isRecording = false;
				bumpUiRevision();
			},
			onReady: async (file: File) => {
				const attachments: ComposerDraftState["attachments"] = [];
				await appendPendingFiles(attachments, [file], "audio");
				setDraftState((prev) => ({
					...prev,
					attachments: [...prev.attachments, ...attachments],
				}));
				bumpUiRevision();
			},
			onStateChanged: bumpUiRevision,
		});
	}, [recordingState, bumpUiRevision]);

	useEffect(() => {
		return () => {
			stopComposerRecordingTracks(recordingState);
		};
	}, [recordingState]);

	return {
		uiRevision,
		draftState,
		recordingState,
		bumpUiRevision,
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
	};
}
