import { getAudioExtension } from "./pendingAttachments";
import type { ComposerRecordingState } from "./composerTypes";

interface StartComposerRecordingOptions {
	state: ComposerRecordingState;
	onUnsupported: () => void;
	onError: () => void;
	onReady: (file: File, stream: MediaStream) => void | Promise<void>;
	onStateChanged?: () => void | Promise<void>;
}

export async function startComposerRecording(
	options: StartComposerRecordingOptions,
): Promise<void> {
	const { state, onError, onReady, onStateChanged, onUnsupported } = options;

	if (
		!navigator.mediaDevices?.getUserMedia ||
		typeof MediaRecorder === "undefined"
	) {
		onUnsupported();
		return;
	}

	try {
		state.cancelRecordingStart = false;
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: true,
		});
		if (state.cancelRecordingStart || state.discardRecording) {
			stream.getTracks().forEach((track) => track.stop());
			state.cancelRecordingStart = false;
			state.discardRecording = false;
			return;
		}
		state.audioChunks = [];
		state.discardRecording = false;
		const recorder = new MediaRecorder(stream);
		state.mediaRecorder = recorder;
		state.isRecording = true;
		recorder.addEventListener("dataavailable", (event) => {
			if (event.data.size > 0) {
				state.audioChunks.push(event.data);
			}
		});
		recorder.addEventListener("stop", () => {
			void finishComposerRecording({
				state,
				recorder,
				stream,
				onReady,
				onStateChanged,
			});
		});
		recorder.start();
		await onStateChanged?.();
	} catch {
		state.isRecording = false;
		state.mediaRecorder = null;
		state.audioChunks = [];
		state.cancelRecordingStart = false;
		state.discardRecording = false;
		onError();
	}
}

export function stopComposerRecording(state: ComposerRecordingState): void {
	if (!state.mediaRecorder || state.mediaRecorder.state === "inactive") {
		return;
	}

	state.isRecording = false;
	state.mediaRecorder.stop();
}

export function stopComposerRecordingTracks(
	state: ComposerRecordingState,
): void {
	if (!state.mediaRecorder) {
		state.cancelRecordingStart = true;
		state.discardRecording = true;
		return;
	}

	state.discardRecording = true;
	if (state.mediaRecorder.state !== "inactive") {
		state.isRecording = false;
		state.mediaRecorder.stop();
		return;
	}

	state.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
	state.mediaRecorder = null;
	state.audioChunks = [];
	state.isRecording = false;
	state.cancelRecordingStart = false;
	state.discardRecording = false;
}

interface FinishComposerRecordingOptions {
	state: ComposerRecordingState;
	recorder: MediaRecorder;
	stream: MediaStream;
	onReady: (file: File, stream: MediaStream) => void | Promise<void>;
	onStateChanged?: () => void | Promise<void>;
}

async function finishComposerRecording(
	options: FinishComposerRecordingOptions,
): Promise<void> {
	const { state, recorder, stream, onReady, onStateChanged } = options;
	const shouldDiscard = state.discardRecording;

	try {
		if (!shouldDiscard && state.audioChunks.length > 0) {
			const blob = new Blob(state.audioChunks, {
				type: recorder.mimeType || "audio/webm",
			});
			const extension = getAudioExtension(blob.type);
			const file = new File([blob], `recording-${Date.now()}${extension}`, {
				type: blob.type,
			});
			await onReady(file, stream);
		}
	} finally {
		stream.getTracks().forEach((track) => track.stop());
		if (state.mediaRecorder === recorder) {
			state.mediaRecorder = null;
		}
		state.audioChunks = [];
		state.isRecording = false;
		state.cancelRecordingStart = false;
		state.discardRecording = false;
		if (!shouldDiscard) {
			await onStateChanged?.();
		}
	}
}
