import { useCallback, useEffect, useRef, useState } from "react";
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
	const [, setRecordingRevision] = useState(0);
	const [draftState, setDraftState] = useState<ComposerDraftState>(
		createEmptyDraftState,
	);
	const [recordingState] = useState<ComposerRecordingState>({
		mediaRecorder: null,
		audioChunks: [],
		isRecording: false,
	});
	const latestAttachmentsRef = useRef(draftState.attachments);
	useEffect(() => {
		latestAttachmentsRef.current = draftState.attachments;
	}, [draftState.attachments]);

	const bumpRecordingRevision = useCallback(() => {
		setRecordingRevision((revision) => revision + 1);
	}, []);

	const clearDraft = useCallback(() => {
		stopComposerRecordingTracks(recordingState);
		releasePendingAttachmentPreviews(draftState.attachments);
		setDraftState(createEmptyDraftState());
	}, [recordingState, draftState]);

	const setDraftContent = useCallback((content: string) => {
		setDraftState((prev) => ({
			...prev,
			content,
		}));
	}, []);

	const setTagDraft = useCallback((tagDraft: string) => {
		setDraftState((prev) => ({
			...prev,
			tagDraft,
		}));
	}, []);

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

			return next;
		});
	}, []);

	const removeTag = useCallback(
		(tag: string) => {
			setDraftState((prev) => {
				const next = { ...prev, attachments: prev.attachments };
				removeComposerTag(next, tag);
				if (next.tagsValue === prev.tagsValue) {
					return prev;
				}

				return next;
			});
		},
		[],
	);

	const addTag = useCallback(
		(tag: string) => {
			setDraftState((prev) => {
				const next = { ...prev, attachments: prev.attachments };
				addComposerTag(next, tag);
				if (next.tagsValue === prev.tagsValue) {
					return prev;
				}

				return next;
			});
		},
		[],
	);

	const removeAttachment = useCallback(
		(index: number) => {
			setDraftState((prev) => {
				const attachments = [...prev.attachments];
				if (!removePendingAttachment(attachments, index)) {
					return prev;
				}

				return {
					...prev,
					attachments,
				};
			});
		},
		[],
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
		},
		[],
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
			}
		},
		[],
	);

	const toggleRecording = useCallback(async () => {
		if (recordingState.isRecording) {
			stopComposerRecording(recordingState);
			bumpRecordingRevision();
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
				bumpRecordingRevision();
			},
			onReady: async (file: File) => {
				const attachments: ComposerDraftState["attachments"] = [];
				await appendPendingFiles(attachments, [file], "audio");
				setDraftState((prev) => ({
					...prev,
					attachments: [...prev.attachments, ...attachments],
				}));
			},
			onStateChanged: bumpRecordingRevision,
		});
	}, [recordingState, bumpRecordingRevision]);

	useEffect(() => {
		return () => {
			stopComposerRecordingTracks(recordingState);
			releasePendingAttachmentPreviews(latestAttachmentsRef.current);
		};
	}, [recordingState]);

	return {
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
	};
}
