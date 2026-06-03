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
} from "../views/timeline/composer/composerAttachments";
import { clearComposerDraft } from "../views/timeline/composer/composerDraft";
import {
	startComposerRecording,
	stopComposerRecording,
	stopComposerRecordingTracks,
} from "../views/timeline/composer/composerRecording";

export function useComposerState() {
	const [uiRevision, setUiRevision] = useState(0);
	const [draftState] = useState<ComposerDraftState>({
		content: "",
		tagsValue: "",
		tagDraft: "",
		attachments: [],
	});
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
		clearComposerDraft(draftState);
		releasePendingAttachmentPreviews(draftState.attachments);
		bumpUiRevision();
	}, [recordingState, draftState, bumpUiRevision]);

	const addFiles = useCallback(
		async (files: FileList | File[], typeHint: ComposerFileTypeHint) => {
			await appendPendingFiles(
				draftState.attachments,
				Array.from(files),
				typeHint,
			);
			bumpUiRevision();
		},
		[draftState.attachments, bumpUiRevision],
	);

	const pasteImages = useCallback(
		async (event: ClipboardEvent) => {
			const hasPastedImages = await appendPastedImages(
				draftState.attachments,
				event,
			);
			if (hasPastedImages) {
				bumpUiRevision();
			}
		},
		[draftState.attachments, bumpUiRevision],
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
				await appendPendingFiles(draftState.attachments, [file], "audio");
				bumpUiRevision();
			},
			onStateChanged: bumpUiRevision,
		});
	}, [recordingState, draftState.attachments, bumpUiRevision]);

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
		addFiles,
		pasteImages,
		toggleRecording,
	};
}
